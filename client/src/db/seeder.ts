import { db } from './db';

export const seedDatabase = async () => {
    const count = await db.products.count();
    if (count > 0) return; // Already seeded

    console.log('Seeding database...');

    await db.products.bulkAdd([
        {
            sku_code: '001',
            name: 'Espresso',
            description: 'Single shot espresso',
            category_id: 'Coffee',
            cost_price: 0.50,
            retail_price: 3.50,
            stock_quantity: 100,
            reorder_level: 20
        },
        {
            sku_code: '002',
            name: 'Cappuccino',
            description: 'Espresso with steamed milk foam',
            category_id: 'Coffee',
            cost_price: 0.80,
            retail_price: 4.50,
            stock_quantity: 80,
            reorder_level: 15
        },
        {
            sku_code: '003',
            name: 'Latte',
            description: 'Espresso with steamed milk',
            category_id: 'Coffee',
            cost_price: 0.90,
            retail_price: 5.00,
            stock_quantity: 90,
            reorder_level: 20
        },
        {
            sku_code: '101',
            name: 'Croissant',
            description: 'Butter croissant',
            category_id: 'Pastries',
            cost_price: 1.20,
            retail_price: 3.50,
            stock_quantity: 30,
            reorder_level: 10
        },
        {
            sku_code: '102',
            name: 'Blueberry Muffin',
            description: 'Fresh baked muffin',
            category_id: 'Pastries',
            cost_price: 1.50,
            retail_price: 4.00,
            stock_quantity: 25,
            reorder_level: 8
        },
        {
            sku_code: '103',
            name: 'Chocolate Cookie',
            description: 'Large chocolate chip cookie',
            category_id: 'Pastries',
            cost_price: 0.80,
            retail_price: 2.50,
            stock_quantity: 50,
            reorder_level: 15
        },
        {
            sku_code: '201',
            name: 'Lanka POS T-Shirt',
            description: 'Branded T-Shirt',
            category_id: 'Merch',
            cost_price: 8.00,
            retail_price: 20.00,
            stock_quantity: 15,
            reorder_level: 5
        }
    ]);

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

    // Seed Categories
    const categoryCount = await db.categories.count();
    if (categoryCount === 0) {
        await db.categories.bulkAdd([
            { name: 'Coffee' },
            { name: 'Pastries' },
            { name: 'Beverages' },
            { name: 'Merch' },
            { name: 'Food' }
        ]);
    }

    console.log('Database seeded!');
};
