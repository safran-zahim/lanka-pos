import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const brandSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

export const createBrand = async (req: Request, res: Response) => {
    try {
        const data = brandSchema.parse(req.body);
        const existing = await prisma.brand.findUnique({
            where: { name: data.name },
        });

        if (existing) {
            return res.status(400).json({ error: "Brand already exists" });
        }

        const brand = await prisma.brand.create({
            data: {
                name: data.name,
                description: data.description
            },
        });

        res.status(201).json(brand);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({ error: 'Validation failed', details: formattedErrors });
        } else {
            console.error("Error creating brand:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

export const getBrands = async (req: Request, res: Response) => {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(brands);
    } catch (error) {
        console.error("Error fetching brands:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateBrand = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid brand id' });
        }
        const data = brandSchema.partial().parse(req.body);

        const brand = await prisma.brand.update({
            where: { id },
            data
        });
        res.json(brand);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({ error: 'Validation failed', details: formattedErrors });
        } else {
            console.error("Error updating brand:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

export const deleteBrand = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid brand id' });
        }

        // Check for associated products
        const productCount = await prisma.product.count({
            where: { brandId: id }
        });

        if (productCount > 0) {
            return res.status(400).json({
                error: `Cannot delete brand: ${productCount} products are currently associated with it. Please reassign or delete the products first.`
            });
        }

        await prisma.brand.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting brand:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
