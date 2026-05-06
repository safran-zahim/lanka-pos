import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';

const expenseCategorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional()
});

const expenseSchema = z.object({
    categoryId: z.number().int().positive().optional(),
    category: z.string().optional(),
    amount: z.number().positive("Amount must be positive"),
    description: z.string().optional(),
    paymentMethod: z.string().default("cash"),
});

// Category Endpoints
export const getExpenseCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.expenseCategory.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        console.error("Failed to get expense categories:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createExpenseCategory = async (req: Request, res: Response) => {
    try {
        const data = expenseCategorySchema.parse(req.body);
        const category = await prisma.expenseCategory.create({
            data: {
                name: data.name,
                description: data.description
            }
        });
        res.status(201).json(category);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation Error', details: error.errors });
        }
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Category strictly exists' });
        }
        console.error("Failed to create expense category:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Expense Endpoints
export const getExpenses = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, categoryId } = req.query;
        let where: any = {
            // Only pull manual/general expenses, NOT supplier purchase payouts which have purchaseId/paymentId
            purchaseId: null,
            supplierId: null
        };

        // Also fetch petty cash if category filtration allows or if no category filter
        let pettyWhere: any = {};

        if (startDate && endDate) {
            where.date = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate))
            };
            pettyWhere.createdAt = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate))
            };
        }
        if (categoryId) {
            where.categoryId = Number(categoryId);
            // If filtering by specific expense category DB ID, do not fetch petty cash (which lacks categoryId)
            pettyWhere.id = -1; // impossible ID to force zero results
        }

        const [expenses, pettyCashLogs] = await Promise.all([
            prisma.expense.findMany({
                where,
                include: { categoryRel: true, staff: { select: { id: true, name: true } } },
                orderBy: { date: 'desc' }
            }),
            prisma.pettyCash.findMany({
                where: pettyWhere,
                include: { staff: { select: { id: true, name: true } } }
            })
        ]);

        const mappedPettyCash = pettyCashLogs.map(pc => ({
            id: `PC-${pc.id}`, // String ID to prevent React key collision with expense IDs
            billNumber: 'PETTY-CASH',
            date: pc.createdAt,
            amount: pc.amount,
            description: pc.description,
            paymentMethod: 'cash',
            staff: pc.staff,
            category: { name: pc.type === 'IN' ? 'Petty Cash IN' : 'Petty Cash OUT' },
            categoryRel: { name: pc.type === 'IN' ? 'Petty Cash IN' : 'Petty Cash OUT' }
        }));

        const combined = [...expenses, ...mappedPettyCash].sort((a: any, b: any) =>
            new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
        );

        res.json(combined);
    } catch (error) {
        console.error("Failed to get expenses:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createExpense = async (req: Request, res: Response) => {
    try {
        const data = expenseSchema.parse(req.body);
        // Ensure user is attached
        const user = (req as any).user;
        const staffId = user ? user.id : undefined;

        // Generate unique bill number using timestamp + random suffix to avoid race conditions
        const now = new Date();
        const datePart = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const billNumber = `EXP-${datePart}-${randomSuffix}`;

        // Tie to active shift if cash
        let shiftId = undefined;
        if (data.paymentMethod.toLowerCase() === 'cash' && staffId) {
            const activeShift = await prisma.shift.findFirst({
                where: { staffId: staffId, status: 'OPEN' }
            });
            if (activeShift) {
                shiftId = activeShift.id;
            }
        }

        const expense = await prisma.expense.create({
            data: {
                ...data,
                amount: new Decimal(data.amount),
                billNumber,
                staffId,
                shiftId
            },
            include: { categoryRel: true, staff: { select: { name: true } } }
        });

        // Update shift total if applicable
        if (shiftId) {
            await prisma.shift.update({
                where: { id: shiftId },
                data: { totalExpenses: { increment: new Decimal(data.amount) } }
            });
        }

        res.status(201).json(expense);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation Error', details: error.errors });
        }
        console.error("Failed to create expense:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getExpenseById = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const expense = await prisma.expense.findUnique({
            where: { id },
            include: { categoryRel: true, staff: { select: { name: true } } }
        });
        if (!expense) return res.status(404).json({ error: 'Expense not found' });
        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
