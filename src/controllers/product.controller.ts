import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    skuCode: z.string().optional(),
    barcode: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    unitId: z.string().optional(),
    price: z.number().positive(),
    stock: z.number().int().nonnegative().default(0),
    reorderLevel: z.number().int().nonnegative().default(10),
});

const updateProductSchema = productSchema.partial();

export const getProducts = async (req: Request, res: Response) => {
    try {
        const { search, category, brand, unit } = req.query;

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: String(search) } },
                { skuCode: { contains: String(search) } },
                { barcode: { contains: String(search) } },
            ];
        }
        if (category) where.categoryId = String(category);
        if (brand) where.brandId = String(brand);
        if (unit) where.unitId = String(unit);

        const products = await prisma.product.findMany({
            where,
            include: {
                categoryRel: true,
                brand: true,
                unit: true
            },
            orderBy: { name: 'asc' }
        });
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const data = productSchema.parse(req.body);

        const product = await prisma.product.create({
            data: {
                ...data,
                price: new Decimal(data.price.toString()),
            },
            include: {
                categoryRel: true,
                brand: true,
                unit: true
            }
        });

        res.status(201).json(product);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.error("Error creating product:", error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateProductSchema.parse(req.body);

        const updateData: any = { ...data };
        if (data.price !== undefined) {
            updateData.price = new Decimal(data.price.toString());
        }

        const product = await prisma.product.update({
            where: { id: String(id) },
            data: updateData,
            include: {
                categoryRel: true,
                brand: true,
                unit: true
            }
        });

        res.json(product);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.error("Error updating product:", error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getProductDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: String(id) },
            include: {
                categoryRel: true,
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
        const totalRevenue = (revenueResult as any)[0]?.revenue || 0;

        const latestPurchaseItem = await prisma.purchaseItem.findFirst({
            where: { productId: String(id) },
            orderBy: { purchase: { date: 'desc' } },
            select: { costPrice: true }
        });

        const currentCost = latestPurchaseItem?.costPrice ? new Decimal(latestPurchaseItem.costPrice) : new Decimal(0);
        const currentPrice = new Decimal(product.price);
        const margin = currentPrice.minus(currentCost);

        const recentSales = await prisma.saleItem.findMany({
            where: { productId: String(id) },
            orderBy: { sale: { createdAt: 'desc' } },
            take: 50,
            include: { sale: { select: { createdAt: true } } }
        });

        res.json({
            ...product,
            stats: {
                currentStock: product.stock,
                totalSold: (await prisma.saleItem.aggregate({
                    where: { productId: String(id) },
                    _sum: { quantity: true }
                }))._sum.quantity || 0,
                totalRevenue,
                currentMargin: margin,
                recentSales: recentSales.map(s => ({
                    date: s.sale.createdAt,
                    quantity: s.quantity,
                    price: s.price
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
            where: {
                stock: {
                    lt: prisma.product.fields.reorderLevel // This might not work in SQLite via Prisma findMany easily if compare fields
                }
            }
        });

        // Use raw query as backup if needed, but fixing the field name
        const rawProducts = await prisma.$queryRaw`SELECT * FROM Product WHERE stock < reorderLevel`;
        res.json(rawProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
