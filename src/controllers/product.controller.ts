import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';

const optionalId = z.preprocess(
    (value) => {
        // If explicitly null, keep it null (for clearing fields in updates)
        if (value === null) return null;
        // If empty string, convert to null
        if (value === '') return null;
        // Otherwise pass through for coercion
        return value;
    },
    z.coerce.number().int().positive().nullable().optional()
);

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    skuCode: z.string().nullable().optional(),
    barcode: z.string().nullable().optional(),
    barcodeType: z.enum(['C128', 'C39', 'EAN13', 'EAN8', 'UPCA', 'UPCE']).nullable().optional(),
    description: z.string().nullable().optional(),
    categoryId: optionalId.optional(),
    brandId: optionalId.optional(),
    unitId: optionalId.optional(),
    subCategoryId: optionalId.optional(),
    reorderLevel: z.coerce.number().nonnegative().default(10),
});

const updateProductSchema = productSchema.partial();

export const getProducts = async (req: Request, res: Response) => {
    try {
        const { search, category, subCategory, brand, unit, showInactive } = req.query;

        const where: any = {};

        // By default, filter out inactive products (only show active products)
        // Only include inactive products if explicitly requested
        if (showInactive !== 'true') {
            where.isActive = true;
        }

        if (search) {
            where.OR = [
                { name: { contains: String(search) } },
                { skuCode: { contains: String(search) } },
                { barcode: { contains: String(search) } },
            ];
        }
        if (category) {
            const categoryId = Number(category);
            if (Number.isFinite(categoryId)) where.categoryId = categoryId;
        }
        if (subCategory) {
            const subCategoryId = Number(subCategory);
            if (Number.isFinite(subCategoryId)) where.subCategoryId = subCategoryId;
        }
        if (brand) {
            const brandId = Number(brand);
            if (Number.isFinite(brandId)) where.brandId = brandId;
        }
        if (unit) {
            const unitId = Number(unit);
            if (Number.isFinite(unitId)) where.unitId = unitId;
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                categoryRel: true,
                subCategory: true,
                brand: true,
                unit: true
            },
            orderBy: { name: 'asc' }
        });
        const enriched = await Promise.all(products.map(async (product) => {
            const [purchaseAgg, saleAgg, latestPurchase] = await Promise.all([
                prisma.purchaseItem.aggregate({
                    where: { productId: product.id },
                    _sum: { quantity: true }
                }),
                prisma.saleItem.aggregate({
                    where: { productId: product.id },
                    _sum: { quantity: true }
                }),
                prisma.purchaseItem.findFirst({
                    where: { productId: product.id },
                    include: { purchase: { select: { date: true } } },
                    orderBy: { purchase: { date: 'desc' } }
                })
            ]);

            const totalPurchased = Number(purchaseAgg._sum.quantity || 0);
            const totalSold = Number(saleAgg._sum.quantity || 0);
            const stock = totalPurchased - totalSold;

            return {
                id: product.id,
                name: product.name,
                skuCode: product.skuCode,
                barcode: product.barcode,
                barcodeType: product.barcodeType,
                description: product.description,
                price: product.price ? Number(product.price) : (latestPurchase?.retailPrice ?? latestPurchase?.costPrice) ? Number(latestPurchase?.retailPrice ?? latestPurchase?.costPrice) : 0,
                reorderLevel: Number(product.reorderLevel),
                isActive: product.isActive,
                category: product.category,
                categoryId: product.categoryId,
                categoryRel: product.categoryRel,
                brandId: product.brandId,
                brand: product.brand,
                unitId: product.unitId,
                unit: product.unit,
                subCategoryId: product.subCategoryId,
                subCategory: product.subCategory,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                stock,
                retailPrice: latestPurchase?.retailPrice ? Number(latestPurchase.retailPrice) : null,
                costPrice: latestPurchase?.costPrice ? Number(latestPurchase.costPrice) : null,
                hasPurchase: Boolean(latestPurchase)
            };
        }));

        res.json(enriched);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProductBatches = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid product id' });
        }

        // Get all purchase batches sorted by date (oldest first)
        const batches = await prisma.purchaseItem.findMany({
            where: { productId: id },
            include: { purchase: { select: { date: true } } },
            orderBy: { purchase: { date: 'asc' } }
        });

        // Calculate remaining stock per batch by checking actual sales from each batch
        const batchesWithRemainingStock = await Promise.all(batches.map(async (batch) => {
            const purchasedQty = Number(batch.quantity);

            // Get sales specifically from this batch
            const batchSales = await prisma.saleItem.aggregate({
                where: {
                    productId: id,
                    batchId: batch.id
                },
                _sum: { quantity: true }
            });

            const soldFromThisBatch = Number(batchSales._sum.quantity || 0);
            const remainingInBatch = purchasedQty - soldFromThisBatch;

            return {
                batch_id: batch.id,
                product_id: batch.productId,
                purchased_quantity: purchasedQty,
                quantity: remainingInBatch, // Remaining stock in this specific batch
                remaining_stock: remainingInBatch,
                remaining_in_stock: remainingInBatch,
                cost_price: Number(batch.costPrice),
                retail_price: batch.retailPrice ? Number(batch.retailPrice) : Number(batch.costPrice),
                created_at: batch.purchase.date
            };
        }));

        res.json(batchesWithRemainingStock);
    } catch (error) {
        console.error('Error fetching product batches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const data = productSchema.parse(req.body);

        // Check if SKU is unique if provided
        if (data.skuCode) {
            const existing = await prisma.product.findUnique({
                where: { skuCode: data.skuCode }
            });
            if (existing) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: [{ field: 'skuCode', message: 'SKU code already exists' }]
                });
            }
        }

        const product = await prisma.product.create({
            data: {
                name: data.name,
                skuCode: data.skuCode || null,
                barcode: data.barcode || null,
                barcodeType: data.barcodeType || null,
                description: data.description || null,
                categoryId: data.categoryId || null,
                subCategoryId: data.subCategoryId || null,
                brandId: data.brandId || null,
                unitId: data.unitId || null,
                reorderLevel: data.reorderLevel
            },
            include: {
                categoryRel: true,
                subCategory: true,
                brand: true,
                unit: true
            }
        });

        res.status(201).json(product);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                error: 'Validation failed',
                details: error.errors.map(e => ({
                    field: e.path[0],
                    message: e.message
                }))
            });
        } else {
            console.error("Error creating product:", error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid product id' });
        }

        console.log('Update Product Request Body:', req.body);
        const data = updateProductSchema.parse(req.body);
        console.log('Parsed Update Data:', data);

        // Check if SKU is unique if being updated
        if (data.skuCode) {
            const existing = await prisma.product.findFirst({
                where: {
                    skuCode: data.skuCode,
                    id: { not: id } // Exclude current product
                }
            });
            if (existing) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: [{ field: 'skuCode', message: 'SKU code already exists' }]
                });
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: data,
            include: {
                categoryRel: true,
                subCategory: true,
                brand: true,
                unit: true
            }
        });

        console.log('Updated Product:', { id: product.id, categoryId: product.categoryId, subCategoryId: product.subCategoryId });
        res.json(product);
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Return structured Zod errors
            res.status(400).json({
                error: 'Validation failed',
                details: error.errors.map(e => ({
                    field: e.path[0],
                    message: e.message
                }))
            });
        } else {
            console.error("Error updating product:", error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getProductDetails = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid product id' });
        }
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                categoryRel: true,
                subCategory: true,
                brand: true,
                unit: true,
                _count: {
                    select: { saleItems: true }
                }
            }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const revenueResult = await prisma.$queryRaw`
            SELECT SUM(price * quantity) as revenue FROM SaleItem WHERE productId = ${id}
        `;
        const totalRevenue = Number((revenueResult as any)[0]?.revenue || 0);

        const latestPurchaseItem = await prisma.purchaseItem.findFirst({
            where: { productId: id },
            orderBy: { purchase: { date: 'desc' } },
            select: { costPrice: true }
        });

        const [purchaseAgg, saleAgg, latestRetail] = await Promise.all([
            prisma.purchaseItem.aggregate({
                where: { productId: id },
                _sum: { quantity: true }
            }),
            prisma.saleItem.aggregate({
                where: { productId: id },
                _sum: { quantity: true }
            }),
            prisma.purchaseItem.findFirst({
                where: { productId: id },
                orderBy: { purchase: { date: 'desc' } },
                select: { retailPrice: true, costPrice: true }
            })
        ]);

        const currentCost = latestPurchaseItem?.costPrice ? new Decimal(latestPurchaseItem.costPrice) : new Decimal(0);
        const currentPrice = new Decimal(latestRetail?.retailPrice ?? latestRetail?.costPrice ?? 0);
        const margin = currentPrice.minus(currentCost);

        const totalPurchased = Number(purchaseAgg._sum.quantity || 0);
        const totalSold = Number(saleAgg._sum.quantity || 0);
        const stock = totalPurchased - totalSold;

        const recentSales = await prisma.saleItem.findMany({
            where: { productId: id },
            orderBy: { sale: { createdAt: 'desc' } },
            take: 50,
            include: { sale: { select: { createdAt: true } } }
        });

        res.json({
            id: product.id,
            name: product.name,
            skuCode: product.skuCode,
            barcode: product.barcode,
            barcodeType: product.barcodeType,
            description: product.description,
            price: product.price ? Number(product.price) : null,
            reorderLevel: Number(product.reorderLevel),
            isActive: product.isActive,
            category: product.category,
            categoryId: product.categoryId,
            categoryRel: product.categoryRel,
            brandId: product.brandId,
            brand: product.brand,
            unitId: product.unitId,
            unit: product.unit,
            subCategoryId: product.subCategoryId,
            subCategory: product.subCategory,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            _count: product._count,
            stats: {
                currentStock: stock,
                currentCost: Number(currentCost),
                currentRetail: Number(currentPrice),
                totalSold,
                totalRevenue,
                currentMargin: Number(margin),
                recentSales: recentSales.map(s => ({
                    date: s.sale.createdAt,
                    quantity: Number(s.quantity),
                    price: Number(s.price)
                }))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getLowStock = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: { categoryRel: true, brand: true, unit: true, subCategory: true },
            orderBy: { name: 'asc' }
        });

        const enriched = await Promise.all(products.map(async (product) => {
            const totalPurchased = await prisma.purchaseItem.aggregate({
                where: { productId: product.id },
                _sum: { quantity: true }
            });
            const totalSold = await prisma.saleItem.aggregate({
                where: { productId: product.id },
                _sum: { quantity: true }
            });

            const stock = Number(totalPurchased._sum.quantity || 0) - Number(totalSold._sum.quantity || 0);
            const alertLevel = Number(product.reorderLevel || 0);

            return {
                ...product,
                stock,
                stock_quantity: stock,
                alert_quantity: alertLevel,
                reorder_level: alertLevel,
                category_name: product.categoryRel?.name,
                brand_name: product.brand?.name,
                sku_code: product.skuCode,
                barcode_type: product.barcodeType
            };
        }));

        // Filter products where stock is below or equal to alert level
        const lowStock = enriched.filter((product) => {
            const alertLevel = Number(product.reorderLevel || 0);
            return product.stock <= alertLevel;
        });
        console.log("getLowStock Final Count:", lowStock.length);
        console.log("getLowStock items:", JSON.stringify(lowStock.map(l => ({ name: l.name, stock: l.stock, alertLevel: l.reorder_level }))));

        res.json(lowStock);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid product id' });
        }
        await prisma.product.delete({ where: { id } });
        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Product not found' });
        } else {
            console.error('Error deleting product:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const toggleProductStatus = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid product id' });
        }

        console.log(`[ToggleStatus] Toggling status for product ID: ${id}`);

        const product = await prisma.product.findUnique({
            where: { id },
            select: {
                id: true,
                isActive: true,
                name: true
            }
        });

        if (!product) {
            console.warn(`[ToggleStatus] Product not found for ID: ${id}`);
            return res.status(404).json({ error: 'Product not found' });
        }

        console.log(`[ToggleStatus] Current status for ${product.name} (${product.id}): ${product.isActive}`);

        // Handle null/undefined isActive by defaulting to true (since default db value is true)
        // If it's currently null, treat it as true (active), so toggle makes it false (inactive).
        // Or if we treat null as inactive, toggle makes it true.
        // Let's assume strict boolean toggle: !isActive.
        const currentStatus = product.isActive ?? true;
        const newStatus = !currentStatus;

        console.log(`[ToggleStatus] Setting status to: ${newStatus}`);

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { isActive: newStatus },
            include: {
                categoryRel: true,
                subCategory: true,
                brand: true,
                unit: true
            }
        });

        console.log(`[ToggleStatus] Successfully updated status for product ${id}`);
        res.json(updatedProduct);
    } catch (error) {
        console.error('[ToggleStatus] Error toggling product status:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
