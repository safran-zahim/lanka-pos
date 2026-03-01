import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { Decimal } from 'decimal.js';

export const getTransactions = async (req: Request, res: Response) => {
    try {
        // Fetch data simultaneously
        const [
            sales,
            customerPayments,
            expenses,
            pettyCash,
            supplierPayments
        ] = await Promise.all([
            prisma.sale.findMany({
                where: { status: { in: ['COMPLETED', 'RETURNED'] } },
                include: { customer: { select: { name: true } }, staff: { select: { name: true } } }
            }),
            prisma.customerPayment.findMany({
                include: { customer: { select: { name: true } } }
            }),
            prisma.expense.findMany({
                include: { categoryRel: { select: { name: true } } }
            }),
            prisma.pettyCash.findMany({}),
            prisma.purchasePayment.findMany({
                include: { supplier: { select: { name: true } } }
            })
        ]);

        const transactions: any[] = [];

        // 1. Map Sales (Completed = IN, Returned = OUT)
        sales.forEach(s => {
            if (s.status === 'COMPLETED' && new Decimal(s.total).greaterThan(0)) {
                transactions.push({
                    id: `SALE-${s.id}`,
                    date: s.createdAt,
                    type: 'IN',
                    category: 'Sale',
                    amount: s.total,
                    method: s.paymentMethod || 'mixed',
                    description: s.customer ? `Sale to ${s.customer.name}` : 'Walk-in Sale'
                });
            } else if (s.status === 'RETURNED' && new Decimal(s.total).greaterThan(0)) {
                transactions.push({
                    id: `REFUND-${s.id}`,
                    date: s.createdAt,
                    type: 'OUT',
                    category: 'Refund',
                    amount: s.total,
                    method: s.paymentMethod || 'mixed',
                    description: s.customer ? `Refund to ${s.customer.name}` : 'Walk-in Refund'
                });
            }
        });

        // 2. Map Customer Payments (Debt Repayment = IN)
        customerPayments.forEach(p => {
            transactions.push({
                id: `CPAY-${p.id}`,
                date: p.createdAt,
                type: 'IN',
                category: 'Credit Repayment',
                amount: p.amount,
                method: p.paymentMethod,
                description: p.customer ? `Payment from ${p.customer.name}` : 'Customer Payment'
            });
        });

        // 3. Map Expenses (OUT)
        expenses.forEach(e => {
            if ((e as any).paymentId) return; // Skip if it's linked to a purchase payment

            transactions.push({
                id: `EXP-${e.id}`,
                date: e.date,
                type: 'OUT',
                category: e.categoryRel?.name || 'General Expense',
                amount: e.amount,
                method: e.paymentMethod,
                description: e.description || `Expense #${e.billNumber || e.id}`
            });
        });

        // 4. Map Petty Cash (IN / OUT)
        pettyCash.forEach(pc => {
            transactions.push({
                id: `PC-${pc.id}`,
                date: pc.createdAt,
                type: pc.type as 'IN' | 'OUT',
                category: pc.type === 'IN' ? 'Petty Cash IN' : 'Petty Cash OUT',
                amount: pc.amount,
                method: 'cash',
                description: pc.description
            });
        });

        // 5. Map Supplier Payments (OUT)
        supplierPayments.forEach(sp => {
            transactions.push({
                id: `SPAY-${sp.id}`,
                date: sp.createdAt,
                type: 'OUT',
                category: 'Supplier Payment',
                amount: sp.amount,
                method: sp.method,
                description: sp.supplier ? `Payment to ${sp.supplier.name}` : 'Supplier Payment'
            });
        });

        // Sort descending by date
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        res.json(transactions);
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
