import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';

const openShiftSchema = z.object({
    startingCash: z.number().nonnegative("Starting cash must be 0 or greater"),
    note: z.string().optional()
});

const closeShiftSchema = z.object({
    countedCash: z.number().nonnegative("Counted cash cannot be negative"),
    note: z.string().optional()
});

const pettyCashSchema = z.object({
    amount: z.number().positive("Amount must be greater than zero"),
    type: z.enum(['IN', 'OUT']),
    description: z.string().min(1, "Description is required")
});

// Middleware helper to get active shift
export const getActiveShiftForUser = async (staffId: number) => {
    return await prisma.shift.findFirst({
        where: { staffId, status: 'OPEN' }
    });
};

export const openShift = async (req: Request, res: Response) => {
    try {
        const staffId = (req as any).user.id;
        const data = openShiftSchema.parse(req.body);

        // Check if already open
        const existing = await getActiveShiftForUser(staffId);
        if (existing) {
            return res.status(400).json({ error: "You already have an open register. Close it before opening a new one." });
        }

        const shift = await prisma.shift.create({
            data: {
                staffId,
                startingCash: new Decimal(data.startingCash),
                status: 'OPEN',
                note: data.note
            }
        });

        res.status(201).json(shift);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation Error', details: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getActiveShift = async (req: Request, res: Response) => {
    try {
        const staffId = (req as any).user.id;
        const shift = await getActiveShiftForUser(staffId);

        if (!shift) {
            return res.status(404).json({ error: "No active register found", code: "NO_ACTIVE_SHIFT" });
        }

        // Calculate live expected cash
        const starting = new Decimal(shift.startingCash);
        const sales = new Decimal(shift.totalCashSales);
        const debtPaid = new Decimal(shift.totalCustomerPayments);
        const refunds = new Decimal(shift.totalCashRefunds);
        const supplierPaid = new Decimal(shift.totalSupplierPayments);
        const expenses = new Decimal(shift.totalExpenses);

        // Include Petty Cash
        const pettyCashLogs = await prisma.pettyCash.findMany({ where: { shiftId: shift.id } });
        let totalCashIn = new Decimal(0);
        let totalCashOut = new Decimal(0);
        pettyCashLogs.forEach(log => {
            if (log.type === 'IN') totalCashIn = totalCashIn.plus(log.amount);
            if (log.type === 'OUT') totalCashOut = totalCashOut.plus(log.amount);
        });

        const expectedCash = starting.plus(sales).plus(debtPaid).plus(totalCashIn).minus(refunds).minus(supplierPaid).minus(expenses).minus(totalCashOut);

        // Compute non-cash sales
        const salesData = await prisma.sale.groupBy({
            by: ['paymentMethod'],
            where: { shiftId: shift.id },
            _sum: { total: true }
        });

        let totalCardSales = new Decimal(0);
        let totalCreditSales = new Decimal(0);
        salesData.forEach(item => {
            if (item.paymentMethod === 'card') totalCardSales = totalCardSales.plus(item._sum.total || 0);
            if (item.paymentMethod === 'credit') totalCreditSales = totalCreditSales.plus(item._sum.total || 0);
        });

        res.json({
            ...shift,
            liveExpectedCash: expectedCash.toNumber(),
            totalCardSales: totalCardSales.toNumber(),
            totalCreditSales: totalCreditSales.toNumber()
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const closeShift = async (req: Request, res: Response) => {
    try {
        const staffId = (req as any).user.id;
        const data = closeShiftSchema.parse(req.body);

        const shift = await getActiveShiftForUser(staffId);
        if (!shift) {
            return res.status(404).json({ error: "No active register to close." });
        }

        const starting = new Decimal(shift.startingCash);
        const sales = new Decimal(shift.totalCashSales);
        const debtPaid = new Decimal(shift.totalCustomerPayments);
        const refunds = new Decimal(shift.totalCashRefunds);
        const supplierPaid = new Decimal(shift.totalSupplierPayments);
        const expenses = new Decimal(shift.totalExpenses);

        // Include Petty Cash
        const pettyCashLogs = await prisma.pettyCash.findMany({ where: { shiftId: shift.id } });
        let totalCashIn = new Decimal(0);
        let totalCashOut = new Decimal(0);
        pettyCashLogs.forEach(log => {
            if (log.type === 'IN') totalCashIn = totalCashIn.plus(log.amount);
            if (log.type === 'OUT') totalCashOut = totalCashOut.plus(log.amount);
        });

        const expectedCash = starting.plus(sales).plus(debtPaid).plus(totalCashIn).minus(refunds).minus(supplierPaid).minus(expenses).minus(totalCashOut);
        const countedCash = new Decimal(data.countedCash);
        const difference = countedCash.minus(expectedCash);

        const closedShift = await prisma.shift.update({
            where: { id: shift.id },
            data: {
                status: 'CLOSED',
                endTime: new Date(),
                expectedCash,
                countedCash,
                note: data.note ? (shift.note ? `${shift.note} | Close Note: ${data.note}` : data.note) : shift.note
            }
        });

        // Compute non-cash sales
        const salesData = await prisma.sale.groupBy({
            by: ['paymentMethod'],
            where: { shiftId: shift.id },
            _sum: { total: true }
        });

        let totalCardSales = new Decimal(0);
        let totalCreditSales = new Decimal(0);
        salesData.forEach(item => {
            if (item.paymentMethod === 'card') totalCardSales = totalCardSales.plus(item._sum.total || 0);
            if (item.paymentMethod === 'credit') totalCreditSales = totalCreditSales.plus(item._sum.total || 0);
        });

        res.json({
            ...closedShift,
            difference: difference.toNumber(),
            totalCardSales: totalCardSales.toNumber(),
            totalCreditSales: totalCreditSales.toNumber()
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation Error', details: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getShiftReport = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const shift = await prisma.shift.findUnique({
            where: { id },
            include: { staff: { select: { name: true, role: true } } }
        });

        if (!shift) return res.status(404).json({ error: 'Shift not found' });

        // Aggregate Product Sales for this Shift
        const salesItems = await prisma.saleItem.findMany({
            where: { sale: { shiftId: id } },
            include: { product: { select: { name: true } } }
        });

        const productSalesMap = new Map();
        for (const item of salesItems) {
            const qty = new Decimal(item.quantity).toNumber();
            const rev = new Decimal(item.price).times(qty).toNumber();
            if (productSalesMap.has(item.productId)) {
                const existing = productSalesMap.get(item.productId);
                existing.quantity += qty;
                existing.revenue += rev;
            } else {
                productSalesMap.set(item.productId, {
                    productId: item.productId,
                    name: item.product.name,
                    quantity: qty,
                    revenue: rev
                });
            }
        }

        const productSales = Array.from(productSalesMap.values());

        res.json({
            shift,
            productSales
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addPettyCash = async (req: Request, res: Response) => {
    try {
        const staffId = (req as any).user.id;
        const data = pettyCashSchema.parse(req.body);

        const shift = await getActiveShiftForUser(staffId);
        if (!shift) {
            return res.status(400).json({ error: "No active register found. Open a register first before logging petty cash." });
        }

        const entry = await prisma.pettyCash.create({
            data: {
                shiftId: shift.id,
                staffId,
                amount: new Decimal(data.amount),
                type: data.type,
                description: data.description
            }
        });

        res.status(201).json(entry);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation Error', details: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
