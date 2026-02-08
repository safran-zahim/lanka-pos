import { db } from './db';

export const seedDatabase = async () => {
    console.log('Seeding database...');

    // Seed Users
    const userCount = await db.users.count();
    if (userCount === 0) {
        await db.users.bulkAdd([
            {
                username: 'admin',
                password_hash: 'admin123',
                role: 'admin',
                hourly_rate: 20
            },
            {
                username: 'manager',
                password_hash: 'manager123',
                role: 'manager',
                hourly_rate: 15
            },
            {
                username: 'cashier',
                password_hash: 'cashier123',
                role: 'cashier',
                hourly_rate: 12
            }
        ]);
    }

    // Categories and products are not seeded by default.

    console.log('Database seeded!');
};
