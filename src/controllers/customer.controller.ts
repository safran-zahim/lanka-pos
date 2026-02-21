import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';


const customerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.preprocess(
        (val) => (typeof val === 'string' ? val.trim() : val),
        z.string().min(1, "Phone number is required")
    ),
    email: z.preprocess(
        (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
        z.string().email("Invalid email format").optional()
    ),
    address: z.string().optional(),
});

const customerUpdateSchema = customerSchema.partial();

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;

        // "Search for a customer by phone or name."
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: String(search) } },
                { phone: { contains: String(search) } },
            ];
        }

        // Default limit to avoid fetching all if no search?
        // User request: "Search for a customer..." implies search is primary, but "List all" isn't explicitly forbidden.
        // I'll return all if no search, or empty? usually return all with pagination. 
        // Keeping it simple: return max 50 if no search.

        const customers = await prisma.customer.findMany({
            where,
            take: 50,
            orderBy: { createdAt: 'desc' }
        });

        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const data = customerSchema.parse(req.body);

        const customer = await prisma.customer.create({
            data,
        });

        res.status(201).json(customer);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else if (error.code === 'P2002') { // Unique constraint violation (phone)
            res.status(409).json({ error: 'Customer with this phone number already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getCustomerHistory = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid customer id' });
        }

        const sales = await prisma.sale.findMany({
            where: { customerId: id },
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
        });

        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getCustomerDetails = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid customer id' });
        }
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                sales: {
                    include: { items: { include: { product: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 10 // Limit recent sales
                },
                pointsLedger: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                _count: {
                    select: { sales: true }
                }
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Calculate aggregates
        const totalSpentAggregate = await prisma.sale.aggregate({
            where: { customerId: id },
            _sum: { total: true },
            _max: { createdAt: true }
        });

        const totalSpent = totalSpentAggregate._sum.total || new Decimal(0);
        const lastVisit = totalSpentAggregate._max.createdAt || customer.createdAt; // Fallback to creation date

        res.json({
            ...customer,
            stats: {
                totalSpent,
                lastVisit,
                pointsBalance: customer.pointsBalance || 0,
                visitCount: customer._count.sales
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid customer id' });
        }
        const data = customerUpdateSchema.parse(req.body);

        const updated = await prisma.customer.update({
            where: { id },
            data,
        });

        res.json(updated);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else if (error.code === 'P2025') {
            res.status(404).json({ error: 'Customer not found' });
        } else if (error.code === 'P2002') {
            res.status(409).json({ error: 'Customer with this phone number already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid customer id' });
        }
        await prisma.customer.delete({ where: { id } });
        res.json({ message: 'Customer deleted' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Customer not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getCustomerPointsHistory = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid customer id' });
        }
        const points = await prisma.customerPointLedger.findMany({
            where: { customerId: id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(points);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
const paymentSchema = z.object({
    amount: z.number().positive(),
    paymentMethod: z.string(),
    note: z.string().optional()
});

export const processPayment = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const data = paymentSchema.parse(req.body);

        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const result = await prisma.$transaction(async (tx) => {
            // Update customer debt
            const updatedCustomer = await tx.customer.update({
                where: { id },
                data: {
                    totalDue: { decrement: new Decimal(data.amount) }
                }
            });

            // Create payment record
            const payment = await tx.customerPayment.create({
                data: {
                    customerId: id,
                    amount: new Decimal(data.amount),
                    paymentMethod: data.paymentMethod,
                    note: data.note
                }
            });

            return { updatedCustomer, payment };
        });

        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getCustomerPaymentsHistory = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid customer id' });
        }
        const payments = await prisma.customerPayment.findMany({
            where: { customerId: id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
