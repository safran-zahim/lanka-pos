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

    // Create Staff Users
    const users = [
        { id: 1, name: 'SuperAdmin', role: 'super_admin', password: 'admin123' },
        { id: 2, name: 'Admin', role: 'admin', password: 'admin123' },
        { id: 3, name: 'Manager', role: 'manager', password: 'manager123' },
        { id: 4, name: 'Cashier', role: 'cashier', password: 'cashier123' }
    ];

    for (const user of users) {
        const exists = await prisma.staff.findUnique({ 
            where: { id: user.id } 
        });

        if (!exists) {
            await prisma.staff.create({
                data: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    password: user.password
                }
            });
            console.log(`${user.role} created: ${user.name} / ${user.password} (ID: ${user.id})`);
        } else {
            console.log(`${user.name} already exists (ID: ${user.id})`);
        }
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
