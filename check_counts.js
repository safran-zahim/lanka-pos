const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.count();
    const customers = await prisma.customer.count();
    const categories = await prisma.category.count();
    const suppliers = await prisma.supplier.count();
    const staff = await prisma.staff.count();
    const sales = await prisma.sale.count();

    console.log('COUNTS:', {
        products,
        customers,
        categories,
        suppliers,
        staff,
        sales
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
