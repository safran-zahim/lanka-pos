import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

// Schema for clock-in
const clockInSchema = z.object({
    staff_id: z.string(),
    cash_drawer_balance: z.number(), // Using number for input, will be converted to Decimal
});

export const getPerformance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Staff ID from URL or query? The prompt says /staff/performance, maybe for *current* staff or specific? 
        // "Retrieve sales stats for a specific staff member." 
        // Usually fetching for *a* staff member would be /staff/:id/performance. 
        // If it's just /staff/performance, it might imply the logged-in user OR it accepts a query param. 
        // Given "Manager+" auth, it likely allows viewing others. I'll assume query param or body, or maybe specific ID in path?
        // Let's assume ?staff_id=... for now as the endpoint is just /staff/performance

        const staffId = req.query.staff_id as string;

        if (!staffId) {
            return res.status(400).json({ error: 'Staff ID is required' });
        }

        const sales = await prisma.sale.findMany({
            where: { staffId },
        });

        const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const transactionCount = sales.length;

        res.json({ staff_id: staffId, total_sales: totalSales, transaction_count: transactionCount });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const clockIn = async (req: Request, res: Response) => {
    try {
        const { staff_id, cash_drawer_balance } = clockInSchema.parse(req.body);

        const shift = await prisma.shift.create({
            data: {
                staffId: staff_id,
                cashStart: cash_drawer_balance,
                startTime: new Date(),
            },
        });

        res.json(shift);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
