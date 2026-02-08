import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding...');

    // Create Plan
    const plan = await prisma.subscriptionPlan.upsert({
        where: { name: 'Premium' },
        update: {},
        create: {
            name: 'Premium',
            price: 99.99,
            duration: 30,
            features: JSON.stringify(['Reporting', 'Inventory Management', 'Customer CRM', 'Multi-User Support']),
            active: true
        }
    });
    console.log('Plan created:', plan.name);

    // Create Super Admin
    const password = 'admin123';
    const exists = await prisma.staff.findFirst({ where: { role: 'super_admin' } });

    if (!exists) {
        await prisma.staff.create({
            data: {
                name: 'SuperAdmin',
                role: 'super_admin',
                password: password
            }
        });
        console.log('Super Admin created: SuperAdmin / admin123');
    } else {
        console.log('Super Admin already exists');
    }

    // Update AppConfig to use plan
    await prisma.appConfig.upsert({
        where: { key: 'main' },
        update: { subscriptionPlanId: plan.id },
        create: { key: 'main', subscriptionStatus: 'active', subscriptionPlanId: plan.id }
    });
    console.log('AppConfig updated');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
