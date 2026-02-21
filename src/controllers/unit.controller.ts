import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const unitSchema = z.object({
    name: z.string().min(1, "Name is required"),
    shortName: z.string().min(1, "Short name is required"),
    allowDecimal: z.boolean().default(false),
});

export const createUnit = async (req: Request, res: Response) => {
    try {
        const data = unitSchema.parse(req.body);
        const existing = await prisma.unit.findUnique({
            where: { name: data.name },
        });

        if (existing) {
            return res.status(400).json({ error: "Unit already exists" });
        }

        const unit = await prisma.unit.create({
            data: {
                name: data.name,
                shortName: data.shortName,
                allowDecimal: data.allowDecimal
            },
        });

        res.status(201).json(unit);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.error("Error creating unit:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

export const getUnits = async (req: Request, res: Response) => {
    try {
        const units = await prisma.unit.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(units);
    } catch (error) {
        console.error("Error fetching units:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateUnit = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid unit id' });
        }
        const data = unitSchema.partial().parse(req.body);

        const unit = await prisma.unit.update({
            where: { id },
            data
        });
        res.json(unit);
    } catch (error) {
        console.error("Error updating unit:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteUnit = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid unit id' });
        }
        await prisma.unit.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting unit:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
