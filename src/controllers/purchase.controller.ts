import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';

const optionalId = z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.coerce.number().int().positive()
);

const purchaseItemSchema = z.object({
    product_id: z.coerce.number().int().positive(),
    quantity: z.number().positive(),
    cost_price: z.number().nonnegative(),
    retail_price: z.number().nonnegative()
});

const purchaseSchema = z.object({
    supplier_id: optionalId.optional(),
    total_amount: z.number().nonnegative(),
    paid_amount: z.number().nonnegative().optional(),
    status: z.string().optional(),
    payment_method: z.string().optional(),
    payment_date: z.string().optional(),
    date: z.string().optional(),
    ref_number: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(purchaseItemSchema)
});

const purchasePaymentSchema = z.object({
    amount: z.number().positive(),
    method: z.string().min(1),
    paid_at: z.string().optional()
});

export const createPurchase = async (req: Request, res: Response) => {
    try {
        const data = purchaseSchema.parse(req.body);
        if (!data.supplier_id) {
            return res.status(400).json({ error: 'Supplier is required.' });
        }
        const purchaseDate = data.date ? new Date(data.date) : new Date();

        // Validate that quantities match unit decimal settings
        for (const item of data.items) {
            const product = await prisma.product.findUnique({
                where: { id: item.product_id },
                include: { unit: true }
            });

            if (!product) {
                return res.status(400).json({ 
                    error: `Product with ID ${item.product_id} not found` 
                });
            }

            // Check if product is inactive
            if (product.isActive === false) {
                return res.status(400).json({ 
                    error: `Product "${product.name}" is inactive and cannot be purchased. Please activate the product first.` 
                });
            }

            // Check if quantity has decimals and unit doesn't allow them
            if (product.unit && !product.unit.allowDecimal) {
                const hasDecimals = !Number.isInteger(item.quantity);
                if (hasDecimals) {
                    return res.status(400).json({ 
                        error: `Product "${product.name}" uses unit "${product.unit.name}" which does not accept decimal quantities. Please enter a whole number.` 
                    });
                }
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            const paidAmountValue = new Decimal(data.paid_amount || 0);
            const totalAmountValue = new Decimal(data.total_amount);
            const normalizedStatus = String(data.status || '').toLowerCase();
            const resolvedStatus = data.status
                ? (normalizedStatus === 'paid' || normalizedStatus === 'completed'
                    ? 'COMPLETED'
                    : normalizedStatus === 'partial'
                        ? 'PARTIAL'
                        : normalizedStatus === 'due' || normalizedStatus === 'pending'
                            ? 'PENDING'
                            : (data.status || '').toString() || 'PENDING')
                : (paidAmountValue.greaterThanOrEqualTo(totalAmountValue)
                    ? 'COMPLETED'
                    : paidAmountValue.greaterThan(0)
                        ? 'PARTIAL'
                        : 'PENDING');
            const purchaseData: any = {
                totalAmount: totalAmountValue,
                paidAmount: paidAmountValue,
                status: resolvedStatus,
                date: purchaseDate,
                items: {
                    create: data.items.map((item) => ({
                        productId: item.product_id,
                        quantity: item.quantity,
                        costPrice: new Decimal(item.cost_price),
                        retailPrice: new Decimal(item.retail_price)
                    }))
                }
            };
            
            if (data.supplier_id) {
                purchaseData.supplierId = data.supplier_id;
            }

            const purchase = await tx.purchase.create({
                data: purchaseData,
                include: { items: true, supplier: true }
            });

            if (paidAmountValue.greaterThan(0) && data.payment_method) {
                const paidAt = data.payment_date ? new Date(data.payment_date) : purchaseDate;
                const payment = await tx.purchasePayment.create({
                    data: {
                        purchaseId: purchase.id,
                        supplierId: purchase.supplierId,
                        amount: paidAmountValue,
                        method: data.payment_method,
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
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const missingFields = error.errors
                .filter((err) => err.code === 'invalid_type' && err.received === 'undefined')
                .map((err) => err.path.join('.'));
            const message = missingFields.length > 0
                ? `Missing required fields: ${missingFields.join(', ')}`
                : 'Invalid purchase data.';
            res.status(400).json({ error: message, details: error.errors });
        } else {
            console.error('Failed to create purchase', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getPurchases = async (req: Request, res: Response) => {
    try {
        const purchases = await prisma.purchase.findMany({
            include: {
                items: { include: { product: true } },
                supplier: true,
                payments: true
            },
            orderBy: { date: 'desc' }
        });

        res.json(purchases);
    } catch (error) {
        console.error('Failed to load purchases', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPurchaseById = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid purchase id' });
        }

        const purchase = await prisma.purchase.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                supplier: true,
                payments: true
            }
        });

        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        res.json(purchase);
    } catch (error) {
        console.error('Failed to load purchase', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addPurchasePayment = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid purchase id' });
        }

        const data = purchasePaymentSchema.parse(req.body);
        const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();

        const result = await prisma.$transaction(async (tx) => {
            const purchase = await tx.purchase.findUnique({
                where: { id }
            });

            if (!purchase) {
                return null;
            }

            const paidAmount = new Decimal(purchase.paidAmount);
            const totalAmount = new Decimal(purchase.totalAmount);
            const amount = new Decimal(data.amount);
            const due = totalAmount.minus(paidAmount);

            if (amount.greaterThan(due)) {
                throw new Error('Payment exceeds due amount');
            }

            const updatedPaid = paidAmount.plus(amount);
            const updatedStatus = updatedPaid.greaterThanOrEqualTo(totalAmount) ? 'COMPLETED' : 'PARTIAL';

            const updatedPurchase = await tx.purchase.update({
                where: { id },
                data: {
                    paidAmount: updatedPaid,
                    status: updatedStatus
                }
            });

            const payment = await tx.purchasePayment.create({
                data: {
                    purchaseId: updatedPurchase.id,
                    supplierId: updatedPurchase.supplierId,
                    amount,
                    method: data.method,
                    paidAt
                }
            });

            await tx.expense.create({
                data: {
                    amount,
                    date: paidAt,
                    category: 'purchase_payment',
                    description: `Purchase #${updatedPurchase.id} payment`,
                    supplierId: updatedPurchase.supplierId,
                    purchaseId: updatedPurchase.id,
                    paymentId: payment.id
                }
            });

            return updatedPurchase;
        });

        if (!result) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        res.status(201).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid payment data.', details: error.errors });
        }
        if (error?.message === 'Payment exceeds due amount') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Failed to add purchase payment', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
