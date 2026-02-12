import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';

const supplierSchema = z.object({
    name: z.string().min(1),
    contactPerson: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    taxId: z.string().optional(),
    notes: z.string().optional(),
});

const purchaseItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    costPrice: z.number().positive(),
});

const purchaseSchema = z.object({
    supplierId: z.string(),
    items: z.array(purchaseItemSchema),
    totalAmount: z.number().positive(),
    paidAmount: z.number().nonnegative().optional(),
    status: z.enum(['PENDING', 'COMPLETED', 'PARTIAL']).optional(),
    date: z.string().optional(), // ISO string
});

export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { purchases: true },
                },
            },
        });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSupplierById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                purchases: {
                    orderBy: { date: 'desc' },
                    take: 10, // Recent 10 purchases
                },
            },
        });

        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        // Aggregations for stats
        const stats = await prisma.purchase.aggregate({
            where: { supplierId: id },
            _sum: {
                totalAmount: true,
                paidAmount: true,
            },
            _count: {
                id: true,
            },
        });

        res.json({
            ...supplier,
            stats: {
                totalPurchased: stats._sum?.totalAmount || 0,
                totalPaid: stats._sum?.paidAmount || 0,
                totalDue: new Decimal(stats._sum?.totalAmount || 0).minus(stats._sum?.paidAmount || 0),
                purchaseCount: typeof stats._count === 'number' ? stats._count : (stats._count?.id || 0),
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createSupplier = async (req: Request, res: Response) => {
    try {
        const data = supplierSchema.parse(req.body);
        const supplier = await prisma.supplier.create({ data });
        res.status(201).json(supplier);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const data = supplierSchema.partial().parse(req.body);
        const supplier = await prisma.supplier.update({
            where: { id },
            data,
        });
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        await prisma.supplier.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createPurchase = async (req: Request, res: Response) => {
    try {
        const data = purchaseSchema.parse(req.body);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Purchase
            const purchase = await tx.purchase.create({
                data: {
                    supplierId: data.supplierId,
                    totalAmount: new Decimal(data.totalAmount),
                    paidAmount: new Decimal(data.paidAmount || 0),
                    status: data.status || 'PENDING',
                    date: data.date ? new Date(data.date) : new Date(),
                    items: {
                        create: data.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            costPrice: new Decimal(item.costPrice),
                        })),
                    },
                },
                include: { items: true },
            });

            // 2. Update Product Stock
            for (const item of data.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                    },
                });
            }

            return purchase;
        });

        res.status(201).json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
