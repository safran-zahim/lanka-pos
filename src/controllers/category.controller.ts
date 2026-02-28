import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const categorySchema = z.object({
    name: z.string().min(1, "Name is required"),
});

const categoryUpdateSchema = categorySchema.partial();

const subCategorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    categoryId: z.coerce.number().int().positive({ message: "Category ID is required" }),
});

const subCategoryUpdateSchema = z.object({
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
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({ error: 'Validation failed', details: formattedErrors });
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
            include: {
                subCategories: {
                    orderBy: { name: 'asc' }
                }
            }
        });
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: "Invalid category id" });
        }

        // Check for associated products
        const productCount = await prisma.product.count({
            where: { categoryId: id }
        });

        if (productCount > 0) {
            return res.status(400).json({
                error: `Cannot delete category: ${productCount} products are currently associated with it. Please reassign or delete the products first.`
            });
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

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid category id' });
        }
        const data = categoryUpdateSchema.parse(req.body);

        const category = await prisma.category.update({
            where: { id },
            data: { name: data.name }
        });

        res.json(category);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({ error: 'Validation failed', details: formattedErrors });
        } else if (error.code === 'P2025') {
            res.status(404).json({ error: 'Category not found' });
        } else {
            console.error('Error updating category:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

// SubCategory CRUD operations
export const createSubCategory = async (req: Request, res: Response) => {
    try {
        const data = subCategorySchema.parse(req.body);

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId }
        });

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        // Check if subcategory already exists for this category
        const existing = await prisma.subCategory.findUnique({
            where: {
                categoryId_name: {
                    categoryId: data.categoryId,
                    name: data.name
                }
            }
        });

        if (existing) {
            return res.status(400).json({ error: "Subcategory already exists in this category" });
        }

        const subCategory = await prisma.subCategory.create({
            data: {
                name: data.name,
                categoryId: data.categoryId
            },
        });

        res.status(201).json(subCategory);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({ error: 'Validation failed', details: formattedErrors });
        } else {
            console.error("Error creating subcategory:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

export const getSubCategories = async (req: Request, res: Response) => {
    try {
        const categoryIdParam = req.params.categoryId;
        const categoryId = categoryIdParam ? Number(categoryIdParam) : null;
        if (categoryIdParam && !Number.isFinite(categoryId)) {
            return res.status(400).json({ error: 'Invalid category id' });
        }

        const subCategories = await prisma.subCategory.findMany({
            where: categoryId ? { categoryId } : undefined,
            orderBy: { name: 'asc' },
            include: {
                category: true
            }
        });

        res.json(subCategories);
    } catch (error) {
        console.error("Error fetching subcategories:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateSubCategory = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid subcategory id' });
        }
        const data = subCategoryUpdateSchema.parse(req.body);

        const subCategory = await prisma.subCategory.update({
            where: { id },
            data: { name: data.name }
        });

        res.json(subCategory);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({ error: 'Validation failed', details: formattedErrors });
        } else if (error.code === 'P2025') {
            res.status(404).json({ error: 'Subcategory not found' });
        } else {
            console.error('Error updating subcategory:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const deleteSubCategory = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: "Invalid subcategory id" });
        }

        await prisma.subCategory.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting subcategory:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
