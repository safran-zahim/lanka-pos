import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkShadowDebt() {
    console.log("=== LANKA POS SECURE AUDIT: SHADOW DEBT ===");
    try {
        const query = `
            SELECT 
                c.id AS Customer_ID, 
                c.name AS Customer_Name, 
                ROUND(c.totalDue, 2) AS Profile_Debt_Cache, 
                ROUND(IFNULL(DebtLedger.TotalUnpaidBill, 0) - IFNULL(PaymentLedger.TotalPaid, 0), 2) AS Real_Mathematical_Debt,
                ROUND(c.totalDue - (IFNULL(DebtLedger.TotalUnpaidBill, 0) - IFNULL(PaymentLedger.TotalPaid, 0)), 2) AS Shadow_Debt_Variance
            FROM Customer c
            LEFT JOIN (
                SELECT customerId, SUM(dueAmount) as TotalUnpaidBill 
                FROM Sale 
                WHERE dueAmount > 0 
                GROUP BY customerId
            ) AS DebtLedger ON c.id = DebtLedger.customerId
            LEFT JOIN (
                SELECT customerId, SUM(amount) as TotalPaid 
                FROM CustomerPayment 
                GROUP BY customerId
            ) AS PaymentLedger ON c.id = PaymentLedger.customerId
            HAVING Shadow_Debt_Variance != 0;
        `;

        const discrepancies = await prisma.$queryRawUnsafe(query);

        if (Array.isArray(discrepancies) && discrepancies.length > 0) {
            console.log("⚠️ WARNING: SHADOW DEBT DISCREPANCIES FOUND!");
            console.table(discrepancies.map(String));
        } else {
            console.log("✅ SYSTEM FLOATING: No shadow debts found! The mathematically calculated ledger perfectly matches all customer cached profile balances.");
        }
    } catch (e) {
        console.error("Audit query failed:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkShadowDebt();
