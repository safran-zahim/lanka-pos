import prisma from './src/utils/prisma';
async function main() {
    const staff = await prisma.staff.findMany({
        select: { id: true, name: true, role: true }
    });
    console.log(JSON.stringify(staff, null, 2));
}
main().finally(() => prisma.$disconnect());
