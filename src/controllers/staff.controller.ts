import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import bcrypt from 'bcryptjs';

// Schema for clock-in
const clockInSchema = z.object({
    staff_id: z.coerce.number().int().positive(),
    cash_drawer_balance: z.number(), // Using number for input, will be converted to Decimal
});

const staffCreateSchema = z.object({
    name: z.string().min(1),
    role: z.enum(['admin', 'manager', 'cashier', 'super_admin']),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    hourly_rate: z.number().optional()
});

const staffUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    role: z.enum(['admin', 'manager', 'cashier', 'super_admin']).optional(),
    hourly_rate: z.number().optional()
});

const staffPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters long")
});

export const getStaffList = async (req: Request, res: Response) => {
    try {
        const staff = await prisma.staff.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, role: true, hourlyRate: true, createdAt: true }
        });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createStaff = async (req: Request, res: Response) => {
    try {
        const data = staffCreateSchema.parse(req.body);

        const existing = await prisma.staff.findFirst({
            where: { name: data.name }
        });

        if (existing) {
            return res.status(409).json({ error: 'Staff name already exists' });
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);

        const staff = await prisma.staff.create({
            data: {
                name: data.name.toLowerCase(),
                role: data.role,
                password: hashedPassword,
                hourlyRate: data.hourly_rate !== undefined ? new Decimal(data.hourly_rate) : null
            },
            select: { id: true, name: true, role: true, hourlyRate: true, createdAt: true }
        });

        res.status(201).json(staff);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({ error: 'Validation failed', details: formattedErrors });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const updateStaff = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid staff id' });
        }
        const data = staffUpdateSchema.parse(req.body);

        const updateData: any = { ...data };
        if (data.name) {
            updateData.name = data.name.toLowerCase();
        }
        if (data.hourly_rate !== undefined) {
            updateData.hourlyRate = new Decimal(data.hourly_rate);
            delete updateData.hourly_rate;
        }

        const staff = await prisma.staff.update({
            where: { id },
            data: updateData,
            select: { id: true, name: true, role: true, hourlyRate: true, createdAt: true }
        });

        res.json(staff);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({ error: 'Validation failed', details: formattedErrors });
        } else if (error.code === 'P2025') {
            res.status(404).json({ error: 'Staff not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const deleteStaff = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid staff id' });
        }
        await prisma.staff.delete({ where: { id } });
        res.json({ message: 'Staff deleted' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Staff not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const resetStaffPassword = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid staff id' });
        }
        const data = staffPasswordSchema.parse(req.body);

        const hashedPassword = await bcrypt.hash(data.password, 12);

        await prisma.staff.update({
            where: { id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password updated' });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else if (error.code === 'P2025') {
            res.status(404).json({ error: 'Staff not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getPerformance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Staff ID from URL or query? The prompt says /staff/performance, maybe for *current* staff or specific? 
        // "Retrieve sales stats for a specific staff member." 
        // Usually fetching for *a* staff member would be /staff/:id/performance. 
        // If it's just /staff/performance, it might imply the logged-in user OR it accepts a query param. 
        // Given "Manager+" auth, it likely allows viewing others. I'll assume query param or body, or maybe specific ID in path?
        // Let's assume ?staff_id=... for now as the endpoint is just /staff/performance

        const staffId = Number(req.query.staff_id);

        if (!Number.isFinite(staffId)) {
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

        // IDOR Fix: Ensure staff_id matches authenticated user
        const authenticatedUser = (req as any).user;
        if (authenticatedUser.id !== staff_id && authenticatedUser.role !== 'admin' && authenticatedUser.role !== 'super_admin') {
            console.warn(`[Security] IDOR attempt by user ${authenticatedUser.id} trying to clock-in for staff_id ${staff_id}`);
            return res.status(403).json({ error: 'Unauthorized staff ID' });
        }

        const shift = await prisma.shift.create({
            data: {
                staffId: staff_id,
                startingCash: cash_drawer_balance,
                status: 'OPEN',
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
