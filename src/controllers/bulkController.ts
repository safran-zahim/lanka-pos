import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';

const productImportSchema = z.object({
    name: z.string().min(1, "Name is required"),
    skuCode: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    barcodeType: z.string().optional().nullable(),
    category_id: z.string().optional().nullable(),
    sub_category_id: z.string().optional().nullable(),
    unit_id: z.string().optional().nullable(),
    brand_id: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    price: z.number().optional().nullable(),
    costPrice: z.number().optional().nullable(),
    stock: z.number().optional().nullable(),
    minStock: z.number().int().optional().nullable().default(10),
});

export const bulkImportProducts = async (req: Request, res: Response) => {
    try {
        if (!Array.isArray(req.body)) {
            return res.status(400).json({ error: 'Expected an array of products' });
        }

        let importedCount = 0;
        const errors: string[] = [];

        await prisma.$transaction(async (tx) => {
            for (const p of req.body) {
                const result = productImportSchema.safeParse(p);
                if (!result.success) {
                    errors.push(`${p.name || 'Unknown'}: ${result.error.errors.map(e => e.message).join(', ')}`);
                    continue;
                }

                try {
                    const data = result.data;
                    let categoryId = null;
                    let subCategoryId = null;
                    let brandId = null;
                    let unitId = null;

                    if (data.category_id && String(data.category_id).trim() !== '') {
                        const catName = String(data.category_id).trim();
                        const cat = await tx.category.upsert({
                            where: { name: catName },
                            update: {},
                            create: { name: catName }
                        });
                        categoryId = cat.id;

                        if (data.sub_category_id && String(data.sub_category_id).trim() !== '') {
                            const subcatName = String(data.sub_category_id).trim();

                            // Check if subcategory exists for this category
                            let subcat = await tx.subCategory.findFirst({
                                where: { name: subcatName, categoryId: categoryId }
                            });

                            if (!subcat) {
                                subcat = await tx.subCategory.create({
                                    data: { name: subcatName, categoryId: categoryId }
                                });
                            }
                            subCategoryId = subcat.id;
                        }
                    }

                    if (data.brand_id && String(data.brand_id).trim() !== '') {
                        const brandName = String(data.brand_id).trim();
                        const brand = await tx.brand.upsert({
                            where: { name: brandName },
                            update: {},
                            create: { name: brandName }
                        });
                        brandId = brand.id;
                    }

                    if (data.unit_id && String(data.unit_id).trim() !== '') {
                        const unitName = String(data.unit_id).trim();
                        const unit = await tx.unit.upsert({
                            where: { name: unitName },
                            update: {},
                            create: { name: unitName, shortName: unitName.substring(0, 3).toUpperCase() }
                        });
                        unitId = unit.id;
                    }

                    if (data.skuCode) {
                        const existing = await tx.product.findUnique({
                            where: { skuCode: data.skuCode }
                        });
                        if (existing) {
                            // Instead of failing, we could update, but safety first: skip and report 
                            errors.push(`${data.name} (SKU: ${data.skuCode}): SKU already exists`);
                            continue;
                        }
                    }

                    await tx.product.create({
                        data: {
                            name: data.name,
                            skuCode: data.skuCode || null,
                            barcode: data.barcode || null,
                            barcodeType: data.barcodeType || null,
                            description: data.description || null,
                            reorderLevel: data.minStock ?? 10,
                            price: data.price ? new Decimal(data.price) : null,
                            categoryId: categoryId,
                            subCategoryId: subCategoryId,
                            brandId: brandId,
                            unitId: unitId,
                            isActive: true
                        }
                    });

                    // Note: Purposefully ignoring data.stock to enforce "Master Data Only" strictness
                    // No Purchase or Sale records generated here.

                    importedCount++;
                } catch (error: any) {
                    console.error(`Error importing product ${p.name}:`, error);
                    errors.push(`${p.name || 'Unknown'}: Database error`);
                }
            }
        });

        res.json({
            message: `Successfully imported ${importedCount} products`,
            errors: errors.slice(0, 10),
            errorCount: errors.length
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const bulkExportProducts = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: {
                categoryRel: true,
                subCategory: true,
                brand: true,
                unit: true
            },
            orderBy: { name: 'asc' }
        });

        // Structure it nicely for CSV
        const exportData = products.map(p => ({
            Name: p.name,
            SKU: p.skuCode || '',
            Barcode: p.barcode || '',
            BarcodeType: p.barcodeType || '',
            Category: p.categoryRel?.name || '',
            SubCategory: p.subCategory?.name || '',
            Brand: p.brand?.name || '',
            Unit: p.unit?.name || '',
            RetailPrice: p.price ? Number(p.price) : '',
            AlertQty: Number(p.reorderLevel),
            Description: p.description || '',
        }));

        res.json({ data: exportData });
    } catch (error) {
        console.error('Bulk export error:', error);
        res.status(500).json({ error: 'Failed to export products' });
    }
};

const customerImportSchema = z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
});

export const bulkImportCustomers = async (req: Request, res: Response) => {
    try {
        if (!Array.isArray(req.body)) {
            return res.status(400).json({ error: 'Expected an array of customers' });
        }

        let importedCount = 0;
        const errors: string[] = [];

        for (const item of req.body) {
            const result = customerImportSchema.safeParse(item);
            if (!result.success) {
                errors.push(`${item.name || 'Unknown'}: ${result.error.errors.map(e => e.message).join(', ')}`);
                continue;
            }

            try {
                const customer = result.data;
                await prisma.customer.upsert({
                    where: { phone: customer.phone },
                    update: {
                        name: customer.name,
                        email: customer.email || null,
                        address: customer.address || null
                    },
                    create: {
                        name: customer.name,
                        phone: customer.phone,
                        email: customer.email || null,
                        address: customer.address || null
                    },
                });
                importedCount++;
            } catch (error: any) {
                console.error(`Error importing customer ${item.name}:`, error);
                errors.push(`${item.name || 'Unknown'}: Database error`);
            }
        }

        res.json({
            message: `Successfully imported ${importedCount} customers`,
            errors: errors.slice(0, 10), // Return first 10 errors for feedback
            errorCount: errors.length
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
