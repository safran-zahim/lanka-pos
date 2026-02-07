import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const customerSchema = z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email().optional(),
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
        const { id } = req.params;

        const sales = await prisma.sale.findMany({
            where: { customerId: String(id) },
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
        const { id } = req.params;
        const customer = await prisma.customer.findUnique({
            where: { id: String(id) },
            include: {
                sales: { include: { items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } },
                pointsLedger: { orderBy: { createdAt: 'desc' } }
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = customerUpdateSchema.parse(req.body);

        const updated = await prisma.customer.update({
            where: { id: String(id) },
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
        const { id } = req.params;
        await prisma.customer.delete({ where: { id: String(id) } });
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
        const { id } = req.params;
        const points = await prisma.customerPointLedger.findMany({
            where: { customerId: String(id) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(points);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
