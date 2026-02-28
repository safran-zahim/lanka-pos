import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const settingSchema = z.object({
    value: z.any()
});

export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.setting.findMany({
            orderBy: { key: 'asc' }
        });
        res.json(settings);
    } catch (error) {
        console.error('Failed to load settings', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateSetting = async (req: Request, res: Response) => {
    try {
        const key = String(req.params.key);
        if (!key) {
            return res.status(400).json({ error: 'Setting key is required' });
        }

        const data = settingSchema.parse(req.body);

        const setting = await prisma.setting.upsert({
            where: { key },
            update: { value: data.value },
            create: { key, value: data.value }
        });

        res.json(setting);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({ error: 'Validation failed', details: formattedErrors });
        } else {
            console.error('Failed to update setting', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
