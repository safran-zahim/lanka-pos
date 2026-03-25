import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany();
    console.log(JSON.stringify(products.map(p => ({
        id: p.id,
        name: p.name,
        reorderLevel: p.reorderLevel,
        isActive: p.isActive
    })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
