import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { z } from 'zod';
import { getAppConfig } from '../utils/appConfig';
import bcrypt from 'bcrypt';

const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
});

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = loginSchema.parse(req.body);

        const staff = await prisma.staff.findFirst({
            where: { name: username.toLowerCase() },
        });

        if (!staff) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Support both bcrypt hashes and legacy plaintext (migration path)
        let passwordMatch = false;
        if (staff.password.startsWith('$2b$') || staff.password.startsWith('$2a$')) {
            // bcrypt hash
            passwordMatch = await bcrypt.compare(password, staff.password);
        } else {
            // Legacy plaintext — auto-upgrade on successful login
            passwordMatch = staff.password === password;
            if (passwordMatch) {
                const hash = await bcrypt.hash(password, 12);
                await prisma.staff.update({ where: { id: staff.id }, data: { password: hash } });
            }
        }

        if (!passwordMatch) {
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
