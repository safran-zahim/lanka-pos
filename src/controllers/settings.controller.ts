import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { logAudit } from '../utils/auditLogger';

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

        // Restrict developer settings to super admin
        if ((key === 'developerFooter' || key === 'developerFooterEnabled') && (req as any).user?.role !== 'super_admin') {
            return res.status(403).json({ error: 'Only super admin can modify developer settings' });
        }

        const data = settingSchema.parse(req.body);

        const result = await prisma.$transaction(async (tx) => {
            const oldSetting = await tx.setting.findUnique({ where: { key } });
            
            const setting = await tx.setting.upsert({
                where: { key },
                update: { value: data.value },
                create: { key, value: data.value }
            });

            const staff = (req as any).user;
            await logAudit(tx, {
                staffId: staff?.id,
                staffName: staff?.name,
                action: 'UPDATE_SETTING',
                resourceType: 'SETTING',
                resourceId: key,
                oldValue: oldSetting?.value ?? null,
                newValue: data.value,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            return setting;
        });

        res.json(result);
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
