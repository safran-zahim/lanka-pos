import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { Decimal } from 'decimal.js';

export const getDashboardInsights = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        
        // 1. Sales & Financial Pulse (Today)
        const todaySales = await prisma.sale.findMany({
            where: {
                createdAt: { gte: startOfToday, lte: endOfToday },
                status: 'COMPLETED'
            },
            include: { items: true }
        });

        let totalRevenue = new Decimal(0);
        let totalCOGS = new Decimal(0);
        let transactionCount = todaySales.length;

        for (const sale of todaySales) {
            totalRevenue = totalRevenue.plus(new Decimal(sale.total.toString()));
            for (const item of sale.items) {
                // If batchId exists, we can get exact cost
                if (item.batchId) {
                    const batch = await prisma.purchaseItem.findUnique({ where: { id: item.batchId } });
                    if (batch) {
                        totalCOGS = totalCOGS.plus(new Decimal(batch.costPrice.toString()).times(item.quantity.toString()));
                    }
                }
            }
        }

        const netProfit = totalRevenue.minus(totalCOGS);
        const atv = transactionCount > 0 ? totalRevenue.div(transactionCount) : new Decimal(0);

        // 2. Peak Sales Hours (Today's Heatmap)
        const hourlySales = new Array(24).fill(0);
        todaySales.forEach(sale => {
            const hour = new Date(sale.createdAt).getHours();
            hourlySales[hour] += Number(sale.total);
        });

        // 3. Category Performance (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const categorySales = await prisma.saleItem.groupBy({
            by: ['productId'],
            where: {
                sale: { createdAt: { gte: thirtyDaysAgo }, status: 'COMPLETED' }
            },
            _sum: { quantity: true },
            _count: { _all: true }
        });

        // Map product IDs to Categories
        const products = await prisma.product.findMany({
            where: { id: { in: categorySales.map(cs => cs.productId) } },
            select: { id: true, category: true, categoryId: true, categoryRel: { select: { name: true } } }
        });

        const categoryStats: Record<string, number> = {};
        for (const cs of categorySales) {
            const product = products.find(p => p.id === cs.productId);
            const catName = product?.categoryRel?.name || product?.category || 'Uncategorized';
            categoryStats[catName] = (categoryStats[catName] || 0) + Number(cs._sum.quantity || 0);
        }

        // 4. CRM Insights (New vs Returning - All Time)
        const customerOrders = await prisma.sale.groupBy({
            by: ['customerId'],
            where: { customerId: { not: null }, status: 'COMPLETED' },
            _count: { _all: true }
        });

        const returningCustomers = customerOrders.filter(co => co._count._all > 1).length;
        const newCustomers = customerOrders.filter(co => co._count._all === 1).length;

        // 5. Inventory Intelligence & Value
        const allActiveProducts = await prisma.product.findMany({ 
            where: { isActive: true },
            include: { brand: true, categoryRel: true, purchaseItems: true }
        });

        const lowStockItems: any[] = [];
        let totalInventoryValue = new Decimal(0);
        const productStockMap = new Map<number, number>();

        // Calculate current stock levels and inventory value
        for (const p of allActiveProducts) {
            const purchaseAgg = await prisma.purchaseItem.aggregate({ where: { productId: p.id }, _sum: { quantity: true } });
            const saleAgg = await prisma.saleItem.aggregate({ where: { productId: p.id }, _sum: { quantity: true } });
            const stock = Number(purchaseAgg._sum.quantity || 0) - Number(saleAgg._sum.quantity || 0);
            productStockMap.set(p.id, stock);

            if (stock <= Number(p.reorderLevel)) {
                lowStockItems.push({ id: p.id, name: p.name, stock, reorderLevel: p.reorderLevel });
            }

            // Value calculation using latest cost price or average
            const latestBatch = p.purchaseItems.sort((a, b) => b.id - a.id)[0];
            if (latestBatch && stock > 0) {
                totalInventoryValue = totalInventoryValue.plus(new Decimal(latestBatch.costPrice.toString()).times(stock));
            }
        }

        // 6. Top Performers (Last 30 Days)
        const saleItemsIn30Days = await prisma.saleItem.findMany({
            where: {
                sale: { createdAt: { gte: thirtyDaysAgo }, status: 'COMPLETED' }
            },
            include: { product: { include: { brand: true } } }
        });

        const productStatsMap = new Map<number, { name: string, quantity: number, revenue: number, brand: string }>();

        for (const item of saleItemsIn30Days) {
            const current = productStatsMap.get(item.productId) || { 
                name: item.product.name, 
                quantity: 0, 
                revenue: 0, 
                brand: item.product.brand?.name || 'Unknown' 
            };
            current.quantity += Number(item.quantity);
            current.revenue += Number(item.quantity) * Number(item.price);
            productStatsMap.set(item.productId, current);
        }

        const topProducts = Array.from(productStatsMap.entries())
            .map(([id, stats]) => ({
                id,
                name: stats.name,
                quantity: stats.quantity,
                revenue: stats.revenue,
                brand: stats.brand
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // 7. Brand Mix Distribution (Last 30 Days)
        const brandStats: Record<string, number> = {};
        for (const stats of productStatsMap.values()) {
            brandStats[stats.brand] = (brandStats[stats.brand] || 0) + stats.revenue;
        }

        // 8. Slow Moving Items (Instock but no sales in 30 days)
        const soldIn30Days = new Set(saleItemsIn30Days.map(item => item.productId));
        const slowMovingItems = allActiveProducts
            .filter(p => !soldIn30Days.has(p.id) && (productStockMap.get(p.id) || 0) > 0)
            .slice(0, 5)
            .map(p => ({ id: p.id, name: p.name, stock: productStockMap.get(p.id) }));

        res.json({
            pulse: {
                todayRevenue: totalRevenue.toNumber(),
                todayProfit: netProfit.toNumber(),
                atv: atv.toNumber(),
                transactionCount,
                inventoryValue: totalInventoryValue.toNumber()
            },
            heatmap: hourlySales,
            categories: Object.entries(categoryStats).map(([name, value]) => ({ name, value })),
            brands: Object.entries(brandStats).map(([name, value]) => ({ name, value })),
            crm: {
                new: newCustomers,
                returning: returningCustomers
            },
            inventory: {
                lowStockCount: lowStockItems.length,
                topSellers: topProducts.sort((a, b) => b.revenue - a.revenue),
                slowMovers: slowMovingItems
            }
        });

    } catch (error) {
        console.error('Dashboard insights error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getShiftReconciliation = async (req: Request, res: Response) => {
    try {
        const { start, end, staffId } = req.query;
        const where: any = { status: 'CLOSED' };

        if (start || end) {
            where.endTime = {};
            if (start) where.endTime.gte = new Date(String(start));
            if (end) where.endTime.lte = new Date(String(end));
        }

        if (staffId) {
            where.staffId = Number(staffId);
        }

        const shifts = await prisma.shift.findMany({
            where,
            include: { staff: { select: { name: true } } },
            orderBy: { endTime: 'desc' }
        });

        const reconciliation = shifts.map(s => {
            const expected = new Decimal(s.expectedCash?.toString() || '0');
            const counted = new Decimal(s.countedCash?.toString() || '0');
            const variance = counted.minus(expected);

            return {
                id: s.id,
                staffName: s.staff.name,
                startTime: s.startTime,
                endTime: s.endTime,
                startingCash: Number(s.startingCash),
                totalCashSales: Number(s.totalCashSales),
                totalCustomerPayments: Number(s.totalCustomerPayments),
                totalCashRefunds: Number(s.totalCashRefunds),
                totalSupplierPayments: Number(s.totalSupplierPayments),
                totalExpenses: Number(s.totalExpenses),
                expectedCash: Number(expected),
                countedCash: Number(counted),
                variance: Number(variance),
                note: s.note
            };
        });

        res.json(reconciliation);
    } catch (error) {
        console.error('Shift reconciliation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
