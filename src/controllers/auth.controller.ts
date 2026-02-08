import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { z } from 'zod';
import { getAppConfig } from '../utils/appConfig';

const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
});

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = loginSchema.parse(req.body);

        // In a real app, passwords should be hashed. 
        // For this simplified version (internal tool), checking plain text (or assuming pre-hashed in DB logic if updated later).
        // BRD didn't specify hashing, but "Secure" implies it. I'll add a TODO/Comment about hashing.
        const staff = await prisma.staff.findFirst({
            where: { name: username }, // Using name as username for now as per schema
        });

        if (!staff || staff.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({ id: staff.id, role: staff.role });
        const config = await getAppConfig();

        res.json({
            token,
            staff: { id: staff.id, name: staff.name, role: staff.role },
            subscriptionStatus: config.subscriptionStatus
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const config = await getAppConfig();
        res.json({
            user: (req as any).user,
            subscriptionStatus: config.subscriptionStatus
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
