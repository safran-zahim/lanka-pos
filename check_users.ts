import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const staff = await prisma.staff.findMany({ select: { name: true, password: true } });
    console.table(staff);
}

main().catch(console.error).finally(() => prisma.$disconnect());
