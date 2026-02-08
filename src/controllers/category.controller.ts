import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const categorySchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export const createCategory = async (req: Request, res: Response) => {
    try {
        const data = categorySchema.parse(req.body);
        const existing = await prisma.category.findUnique({
            where: { name: data.name },
        });

        if (existing) {
            return res.status(400).json({ error: "Category already exists" });
        }

        const category = await prisma.category.create({
            data: { name: data.name },
        });

        res.status(201).json(category);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.error("Error creating category:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const rawId = req.params.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;
        if (!id) {
            return res.status(400).json({ error: "Category id is required" });
        }
        await prisma.category.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
