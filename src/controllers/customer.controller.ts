import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { logAudit } from '../utils/auditLogger';


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
            take: search ? 50 : 500,
            orderBy: { createdAt: 'desc' }
        });

        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const actor = (req as any).user;
        const data = customerSchema.parse(req.body);

        const customer = await prisma.$transaction(async (tx) => {
            const created = await tx.customer.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    address: data.address,
                }
            });
            await logAudit(tx, {
                staffId: actor?.id,
                staffName: actor?.username,
                action: 'CREATE_CUSTOMER',
                resourceType: 'Customer',
                resourceId: String(created.id),
                newValue: { name: created.name, phone: created.phone, email: created.email },
            });
            return created;
        });

        res.status(201).json(customer);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else if (error.code === 'P2002') {
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

        const outstandingDueAggregate = await prisma.sale.aggregate({
            where: {
                customerId: id,
                dueAmount: { gt: 0 }
            },
            _sum: { dueAmount: true }
        });

        const totalSpent = totalSpentAggregate._sum.total || new Decimal(0);
        const lastVisit = totalSpentAggregate._max.createdAt || customer.createdAt; // Fallback to creation date
        const outstandingDue = outstandingDueAggregate._sum.dueAmount || new Decimal(0);

        res.json({
            ...customer,
            totalDue: outstandingDue,
            stats: {
                totalSpent,
                lastVisit,
                outstandingDue,
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
        const actor = (req as any).user;
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid customer id' });
        }
        const data = customerUpdateSchema.parse(req.body);
        const before = await prisma.customer.findUnique({ where: { id }, select: { name: true, phone: true, email: true, address: true } });

        const updated = await prisma.$transaction(async (tx) => {
            const customer = await tx.customer.update({
                where: { id },
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    address: data.address
                }
            });
            await logAudit(tx, {
                staffId: actor?.id,
                staffName: actor?.username,
                action: 'UPDATE_CUSTOMER',
                resourceType: 'Customer',
                resourceId: String(id),
                oldValue: before,
                newValue: { name: customer.name, phone: customer.phone, email: customer.email, address: customer.address },
            });
            return customer;
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
        const actor = (req as any).user;
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid customer id' });
        }
        const before = await prisma.customer.findUnique({ where: { id }, select: { name: true, phone: true } });
        await prisma.$transaction(async (tx) => {
            await tx.customer.delete({ where: { id } });
            await logAudit(tx, {
                staffId: actor?.id,
                staffName: actor?.username,
                action: 'DELETE_CUSTOMER',
                resourceType: 'Customer',
                resourceId: String(id),
                oldValue: before,
            });
        });
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
    note: z.string().optional(),
    saleId: z.number().optional()
});

export const processPayment = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const data = paymentSchema.parse(req.body);

        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const result = await prisma.$transaction(async (tx) => {
            // Get active shift for staff
            const staffId = (req as any).user?.id;
            let currentShiftId: number | undefined;
            if (staffId) {
                const shift = await tx.shift.findFirst({
                    where: { staffId: staffId, status: 'OPEN' }
                });
                if (shift) currentShiftId = shift.id;
            }

            let remainingAmount = new Decimal(data.amount);
            const createdPayments = [];

            // 1. If specific saleId is provided, pay that first
            if (data.saleId) {
                const sale = await tx.sale.findUnique({ where: { id: data.saleId } });
                if (sale && sale.customerId === id && sale.dueAmount && new Decimal(sale.dueAmount.toString()).gt(0)) {
                    const toPay = Decimal.min(remainingAmount, new Decimal(sale.dueAmount.toString()));
                    await tx.sale.update({
                        where: { id: sale.id },
                        data: { dueAmount: { decrement: toPay } }
                    });
                    const payment = await tx.customerPayment.create({
                        data: {
                            customerId: id,
                            saleId: sale.id,
                            amount: toPay,
                            paymentMethod: data.paymentMethod,
                            note: data.note || `Payment for Bill #${sale.id}`,
                            shiftId: currentShiftId
                        }
                    });
                    createdPayments.push(payment);
                    remainingAmount = remainingAmount.minus(toPay);
                }
            }

            // 2. Distribute remaining amount via FIFO if any
            if (remainingAmount.gt(0)) {
                const unpaidSales = await tx.sale.findMany({
                    where: {
                        customerId: id,
                        dueAmount: { gt: 0 }
                    },
                    orderBy: { createdAt: 'asc' }
                });

                for (const sale of unpaidSales) {
                    if (remainingAmount.lte(0)) break;
                    const saleDue = new Decimal(sale.dueAmount?.toString() || '0');
                    if (saleDue.lte(0)) continue;

                    const toPay = Decimal.min(remainingAmount, saleDue);

                    await tx.sale.update({
                        where: { id: sale.id },
                        data: { dueAmount: { decrement: toPay } }
                    });

                    const payment = await tx.customerPayment.create({
                        data: {
                            customerId: id,
                            saleId: sale.id,
                            amount: toPay,
                            paymentMethod: data.paymentMethod,
                            note: data.note || (data.saleId ? `Overage from Bill #${data.saleId}` : 'General debt repayment')
                        }
                    });
                    createdPayments.push(payment);
                    remainingAmount = remainingAmount.minus(toPay);
                }

                // 3. If still remaining (customer overpaid or no bills found), create a general record
                if (remainingAmount.gt(0)) {
                    const payment = await tx.customerPayment.create({
                        data: {
                            customerId: id,
                            amount: remainingAmount,
                            paymentMethod: data.paymentMethod,
                            note: (data.note || '') + ' (Excess payment/Unallocated)'
                        }
                    });
                    createdPayments.push(payment);
                }
            }

            // Update shift total if cash
            if (currentShiftId && data.paymentMethod === 'cash') {
                await tx.shift.update({
                    where: { id: currentShiftId },
                    data: { totalCustomerPayments: { increment: new Decimal(data.amount) } }
                });
            }

            const outstandingDueAggregate = await tx.sale.aggregate({
                where: {
                    customerId: id,
                    dueAmount: { gt: 0 }
                },
                _sum: { dueAmount: true }
            });

            const updatedCustomer = await tx.customer.update({
                where: { id },
                data: {
                    totalDue: outstandingDueAggregate._sum.dueAmount || new Decimal(0)
                }
            });

            return { updatedCustomer, payments: createdPayments };
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
