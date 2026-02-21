import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';

const productImportSchema = z.object({
    name: z.string(),
    category: z.string().optional(), // We might need to map category name to Category ID or create if not exists.
    price: z.number().optional(), // retail price (stored per purchase batch)
    stock: z.number().int().optional(),
    reorderLevel: z.number().int().default(10),
    costPrice: z.number().optional(), // stored per purchase batch
});

// We should check if we need to handle Categories.
// If category is a string name, we should find or create it.

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
                    // Handle Category
                    let categoryId = null;
                    if (data.category) {
                        const cat = await tx.category.upsert({
                            where: { name: String(data.category) },
                            update: {},
                            create: { name: String(data.category) }
                        });
                        categoryId = cat.id;
                    }

                    // Check if product with name or SKU exists
                    // Product model in schema uses UUID 'id'. 'name' is not unique?
                    // Let's find by name if category matches, or just create.
                    // If we have a unique SKU field in future, use it.

                    const created = await tx.product.create({
                        data: {
                            name: data.name,
                            reorderLevel: data.reorderLevel,
                            categoryId: categoryId,
                            price: data.price ? new Decimal(data.price) : undefined
                        }
                    });

                    if ((data.stock || 0) > 0) {
                        const costPrice = data.costPrice ?? 0;
                        const retailPrice = data.price ?? 0;

                        // Get or create default supplier for bulk imports
                        const supplier = await tx.supplier.findFirst({
                            where: { name: 'Bulk Import' }
                        }) || await tx.supplier.create({
                            data: { name: 'Bulk Import' }
                        });

                        await tx.purchase.create({
                            data: {
                                supplierId: supplier.id,
                                totalAmount: new Decimal(costPrice * data.stock!),
                                paidAmount: new Decimal(costPrice * data.stock!),
                                status: 'COMPLETED',
                                date: new Date(),
                                items: {
                                    create: [{
                                        productId: created.id,
                                        quantity: data.stock!,
                                        costPrice: new Decimal(costPrice),
                                        retailPrice: new Decimal(retailPrice)
                                    }]
                                }
                            }
                        });
                    }
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
