import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
    const sales = await prisma.sale.findMany({
        select: {
            id: true,
            customerId: true,
            dueAmount: true,
            status: true,
            total: true,
            paymentMethod: true,
            paymentDetails: true
        }
    });

    let repairedSales = 0;
    const customerDueMap = new Map<number, Decimal>();

    for (const sale of sales) {
        const currentDue = new Decimal(sale.dueAmount?.toString() || '0');
        let normalizedDue = currentDue;

        if (sale.status === 'RETURNED' || currentDue.lt(0)) {
            normalizedDue = new Decimal(0);
        }

        if (!normalizedDue.eq(currentDue)) {
            await prisma.sale.update({
                where: { id: sale.id },
                data: { dueAmount: normalizedDue }
            });
            repairedSales += 1;
        }

        if (sale.customerId && normalizedDue.gt(0)) {
            customerDueMap.set(
                sale.customerId,
                (customerDueMap.get(sale.customerId) || new Decimal(0)).plus(normalizedDue)
            );
        }
    }

    const customers = await prisma.customer.findMany({
        select: { id: true, totalDue: true }
    });

    let repairedCustomers = 0;
    for (const customer of customers) {
        const recalculatedDue = customerDueMap.get(customer.id) || new Decimal(0);
        const currentDue = new Decimal(customer.totalDue?.toString() || '0');

        if (!recalculatedDue.eq(currentDue)) {
            await prisma.customer.update({
                where: { id: customer.id },
                data: { totalDue: recalculatedDue }
            });
            repairedCustomers += 1;
        }
    }

    console.log(JSON.stringify({ repairedSales, repairedCustomers }, null, 2));
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });