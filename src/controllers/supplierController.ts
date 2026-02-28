import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';

const supplierSchema = z.object({
    name: z.string().min(1),
    contactPerson: z.string().nullable().optional(),
    email: z.string().email().nullable().optional().or(z.literal('')).or(z.literal(null)),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    taxId: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});

const purchaseItemSchema = z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.number().int().positive(),
    costPrice: z.number().positive(),
    retailPrice: z.number().nonnegative(),
});

const purchaseSchema = z.object({
    supplierId: z.coerce.number().int().positive(),
    items: z.array(purchaseItemSchema),
    totalAmount: z.number().positive(),
    paidAmount: z.number().nonnegative().optional(),
    status: z.enum(['PENDING', 'COMPLETED', 'PARTIAL']).optional(),
    paymentMethod: z.string().optional(),
    paymentDate: z.string().optional(),
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
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid supplier id' });
        }
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

        const payments = await prisma.purchasePayment.findMany({
            where: { supplierId: id },
            orderBy: { paidAt: 'desc' },
            take: 20
        });

        res.json({
            ...supplier,
            payments,
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
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid supplier id' });
        }
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
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid supplier id' });
        }
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
            const paidAmountValue = new Decimal(data.paidAmount || 0);
            // 1. Create Purchase
            const purchase = await tx.purchase.create({
                data: {
                    supplierId: data.supplierId,
                    totalAmount: new Decimal(data.totalAmount),
                    paidAmount: paidAmountValue,
                    status: data.status || 'PENDING',
                    date: data.date ? new Date(data.date) : new Date(),
                    items: {
                        create: data.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            costPrice: new Decimal(item.costPrice),
                            retailPrice: new Decimal(item.retailPrice),
                        })),
                    },
                },
                include: { items: true },
            });

            if (paidAmountValue.greaterThan(0) && data.paymentMethod) {
                const paidAt = data.paymentDate ? new Date(data.paymentDate) : purchase.date;
                const payment = await tx.purchasePayment.create({
                    data: {
                        purchaseId: purchase.id,
                        supplierId: purchase.supplierId,
                        amount: paidAmountValue,
                        method: data.paymentMethod,
                        paidAt
                    }
                });

                await tx.expense.create({
                    data: {
                        amount: paidAmountValue,
                        date: paidAt,
                        category: 'purchase_payment',
                        description: `Purchase #${purchase.id} payment`,
                        supplierId: purchase.supplierId,
                        purchaseId: purchase.id,
                        paymentId: payment.id
                    }
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
