import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { z } from 'zod';
import { getAppConfig, isSubscriptionValid } from '../utils/appConfig';
import bcrypt from 'bcryptjs';

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
            passwordMatch = await bcrypt.compare(password, staff.password);
        } else {
            passwordMatch = staff.password === password;
            if (passwordMatch) {
                const hash = await bcrypt.hash(password, 12);
                await prisma.staff.update({ where: { id: staff.id }, data: { password: hash } });
            }
        }

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // === SUBSCRIPTION GATE ===
        // super_admin (developer) is NEVER blocked — they must always be able to log in
        if (staff.role !== 'super_admin') {
            const config = await getAppConfig();
            const check = isSubscriptionValid({
                subscriptionStatus: config.subscriptionStatus,
                isSystemDisabled: config.isSystemDisabled,
                isNeverEnd: config.isNeverEnd,
                subscriptionExpiresAt: config.subscriptionExpiresAt,
            });
            if (!check.valid) {
                return res.status(403).json({
                    error: check.reason,
                    code: 'SUBSCRIPTION_BLOCKED'
                });
            }
        }
        // === END SUBSCRIPTION GATE ===

        const token = generateToken({ id: staff.id, role: staff.role });
        const config = await getAppConfig();

        // Calculate days remaining for frontend warning banners
        let daysRemaining: number | null = null;
        if (!config.isNeverEnd && config.subscriptionExpiresAt) {
            const diff = config.subscriptionExpiresAt.getTime() - Date.now();
            daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        res.json({
            token,
            staff: { id: staff.id, name: staff.name, role: staff.role },
            subscriptionStatus: config.subscriptionStatus,
            subscriptionExpiresAt: config.subscriptionExpiresAt,
            isNeverEnd: config.isNeverEnd,
            daysRemaining,
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
        let daysRemaining: number | null = null;
        if (!config.isNeverEnd && config.subscriptionExpiresAt) {
            const diff = config.subscriptionExpiresAt.getTime() - Date.now();
            daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }
        res.json({
            user: (req as any).user,
            subscriptionStatus: config.subscriptionStatus,
            subscriptionExpiresAt: config.subscriptionExpiresAt,
            isNeverEnd: config.isNeverEnd,
            isSystemDisabled: config.isSystemDisabled,
            daysRemaining,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
