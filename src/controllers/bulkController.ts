import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';

const productImportSchema = z.object({
    name: z.string(),
    category: z.string().optional(), // We might need to map category name to Category ID or create if not exists.
    price: z.number(), // retail price
    stock: z.number().int().default(0),
    reorderLevel: z.number().int().default(10),
    costPrice: z.number().optional(), // Added for completeness, though Product model in schema might need checking if it has costPrice.
    // Checking schema: Product has price, stock, minStock. No costPrice in Product model! (PurchaseItem has it).
    // Wait, step 6 schema: Product model has price, stock, minStock. No costPrice.
    // But implementation plan didn't say to add costPrice to Product.
    // PurchaseItem has costPrice.
    // Logic: Product 'price' is retail price.
});

// We should check if we need to handle Categories.
// If category is a string name, we should find or create it.

export const bulkImportProducts = async (req: Request, res: Response) => {
    try {
        if (!Array.isArray(req.body)) {
            return res.status(400).json({ error: 'Expected an array of products' });
        }

        let importedCount = 0;
        const errors: string[] = [];

        await prisma.$transaction(async (tx) => {
            for (const p of req.body) {
                const result = productImportSchema.safeParse(p);
                if (!result.success) {
                    errors.push(`${p.name || 'Unknown'}: ${result.error.errors.map(e => e.message).join(', ')}`);
                    continue;
                }

                try {
                    const data = result.data;
                    // Handle Category
                    let categoryId = null;
                    if (data.category) {
                        const cat = await tx.category.upsert({
                            where: { name: String(data.category) },
                            update: {},
                            create: { name: String(data.category) }
                        });
                        categoryId = cat.id;
                    }

                    // Check if product with name or SKU exists
                    // Product model in schema uses UUID 'id'. 'name' is not unique?
                    // Let's find by name if category matches, or just create.
                    // If we have a unique SKU field in future, use it.

                    await tx.product.create({
                        data: {
                            name: data.name,
                            price: new Decimal(data.price),
                            stock: data.stock,
                            reorderLevel: data.reorderLevel,
                            categoryId: categoryId,
                        }
                    });
                    importedCount++;
                } catch (error: any) {
                    console.error(`Error importing product ${p.name}:`, error);
                    errors.push(`${p.name || 'Unknown'}: Database error`);
                }
            }
        });

        res.json({
            message: `Successfully imported ${importedCount} products`,
            errors: errors.slice(0, 10),
            errorCount: errors.length
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const customerImportSchema = z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
});

export const bulkImportCustomers = async (req: Request, res: Response) => {
    try {
        if (!Array.isArray(req.body)) {
            return res.status(400).json({ error: 'Expected an array of customers' });
        }

        let importedCount = 0;
        const errors: string[] = [];

        for (const item of req.body) {
            const result = customerImportSchema.safeParse(item);
            if (!result.success) {
                errors.push(`${item.name || 'Unknown'}: ${result.error.errors.map(e => e.message).join(', ')}`);
                continue;
            }

            try {
                const customer = result.data;
                await prisma.customer.upsert({
                    where: { phone: customer.phone },
                    update: {
                        name: customer.name,
                        email: customer.email || null,
                        address: customer.address || null
                    },
                    create: {
                        name: customer.name,
                        phone: customer.phone,
                        email: customer.email || null,
                        address: customer.address || null
                    },
                });
                importedCount++;
            } catch (error: any) {
                console.error(`Error importing customer ${item.name}:`, error);
                errors.push(`${item.name || 'Unknown'}: Database error`);
            }
        }

        res.json({
            message: `Successfully imported ${importedCount} customers`,
            errors: errors.slice(0, 10), // Return first 10 errors for feedback
            errorCount: errors.length
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
