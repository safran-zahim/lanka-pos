import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding...');

    // Create Plan
    const plan = await prisma.subscriptionPlan.upsert({
        where: { name: 'Premium' },
        update: {},
        create: {
            id: 1,
            name: 'Premium',
            price: 99.99,
            duration: 30,
            features: JSON.stringify(['Reporting', 'Inventory Management', 'Customer CRM', 'Multi-User Support']),
            active: true
        }
    });
    console.log('Plan created:', plan.name);

    // Create Staff Users with hashed passwords
    const users = [
        { id: 1, name: 'superadmin', role: 'super_admin', password: 'admin123' },
        { id: 2, name: 'admin', role: 'admin', password: 'admin123' },
        { id: 3, name: 'manager', role: 'manager', password: 'manager123' },
        { id: 4, name: 'cashier', role: 'cashier', password: 'cashier123' }
    ];

    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        await prisma.staff.upsert({
            where: { id: user.id },
            update: {
                name: user.name,
                role: user.role,
                password: hashedPassword
            },
            create: {
                id: user.id,
                name: user.name,
                role: user.role,
                password: hashedPassword
            }
        });
        console.log(`Staff updated/created: ${user.name} (Role: ${user.role}, ID: ${user.id})`);
    }

    // Keep app config aligned with current schema (no subscriptionPlanId relation)
    await prisma.appConfig.upsert({
        where: { key: 'main' },
        update: { subscriptionStatus: 'active' },
        create: { key: 'main', subscriptionStatus: 'active' }
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
