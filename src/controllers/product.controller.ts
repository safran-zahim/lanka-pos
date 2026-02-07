import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';

const productSchema = z.object({
    name: z.string(),
    category: z.string(),
    price: z.number().positive(),
    stock: z.number().int().nonnegative(),
    minStock: z.number().int().nonnegative().optional(),
});

const updateProductSchema = productSchema.partial();

export const getProducts = async (req: Request, res: Response) => {
    try {
        const { search, category } = req.query;

        const where: any = {};
        if (search) {
            where.name = { contains: String(search) }; // SQLite contains is case-sensitive usually, but Prisma might handle it?
        }
        if (category) {
            where.category = String(category);
        }

        const products = await prisma.product.findMany({ where });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const data = productSchema.parse(req.body);

        // Check if product exists? Schema doesn't enforce unique name, but maybe good practice.
        // For now, just create.
        const product = await prisma.product.create({
            data: {
                ...data,
                price: new Decimal(data.price.toString()),
            },
        });

        res.status(201).json(product);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateProductSchema.parse(req.body);

        const updateData: any = { ...data };
        if (data.price !== undefined) {
            updateData.price = new Decimal(data.price.toString());
        }

        const product = await prisma.product.update({
            where: { id: String(id) },
            data: updateData,
        });

        res.json(product);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getLowStock = async (req: Request, res: Response) => {
    try {
        // "Get a list of items below the reorder threshold."
        // Prisma doesn't support direct field comparison in `where` (stock < minStock) easily in standard definition without raw query or extensions.
        // But wait, `minStock` is a field. 
        // `where: { stock: { lt: prisma.product.fields.minStock } }` is NOT supported.
        // We have to use raw query or fetch all/subset and filter.
        // Given scalable requirement, raw query is better.

        // SQLite: SELECT * FROM Product WHERE stock < minStock
        const products = await prisma.$queryRaw`SELECT * FROM Product WHERE stock < minStock`;

        // Note: Raw query returns generic objects. Dates/Decimals might need serialization if not handled by Prisma client properly in raw.
        // Prisma usually handles it.

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
