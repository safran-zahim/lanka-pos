import { Request, Response } from 'express';
import { getAppConfig, updateSubscriptionConfig } from '../utils/appConfig';
import prisma from '../utils/prisma';
import { z } from 'zod';

// ─── Validation ───────────────────────────────────────────────────────────────

const updateSchema = z.object({
    subscriptionStatus: z.enum(['active', 'past_due', 'blocked', 'canceled']).optional(),
    paymentCycle: z.enum(['monthly', 'yearly']).optional(),
    subscriptionExpiresAt: z.string().datetime({ offset: true }).nullable().optional(),
    isNeverEnd: z.boolean().optional(),
    isSystemDisabled: z.boolean().optional(),
    clientNote: z.string().max(500).nullable().optional(),
    historyNote: z.string().max(500).optional(),
});

// ─── Get Subscription Status ─────────────────────────────────────────────────
// Accessible to all authenticated roles (read-only for admin/manager)

export const getSubscriptionStatus = async (_req: Request, res: Response) => {
    try {
        const config = await getAppConfig();

        let daysRemaining: number | null = null;
        if (!config.isNeverEnd && config.subscriptionExpiresAt) {
            const diff = config.subscriptionExpiresAt.getTime() - Date.now();
            daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        res.json({
            subscriptionStatus: config.subscriptionStatus,
            paymentCycle: config.paymentCycle,
            subscriptionExpiresAt: config.subscriptionExpiresAt,
            isNeverEnd: config.isNeverEnd,
            isSystemDisabled: config.isSystemDisabled,
            clientNote: config.clientNote,
            daysRemaining,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get subscription status' });
    }
};

// ─── Update Subscription Status ───────────────────────────────────────────────
// super_admin only

export const updateSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const parsed = updateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.errors });
        }

        const {
            subscriptionStatus,
            paymentCycle,
            subscriptionExpiresAt,
            isNeverEnd,
            isSystemDisabled,
            clientNote,
            historyNote,
        } = parsed.data;

        const currentConfig = await getAppConfig();
        const changedBy = (req as any).user;

        // ── Determine which actions occurred ──
        const actions: string[] = [];
        if (subscriptionStatus && subscriptionStatus !== currentConfig.subscriptionStatus) actions.push('status_change');
        if (paymentCycle && paymentCycle !== currentConfig.paymentCycle) actions.push('cycle_change');
        if (subscriptionExpiresAt !== undefined) actions.push('expiry_set');
        if (isNeverEnd !== undefined && isNeverEnd !== currentConfig.isNeverEnd) actions.push('never_end_toggled');
        if (isSystemDisabled !== undefined && isSystemDisabled !== currentConfig.isSystemDisabled) actions.push('system_disabled');
        if (actions.length === 0) actions.push('config_update');

        // ── Build update payload ──
        const updateData: any = {};
        if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
        if (paymentCycle !== undefined) updateData.paymentCycle = paymentCycle;
        if (subscriptionExpiresAt !== undefined) updateData.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
        if (isNeverEnd !== undefined) updateData.isNeverEnd = isNeverEnd;
        if (isSystemDisabled !== undefined) updateData.isSystemDisabled = isSystemDisabled;
        if (clientNote !== undefined) updateData.clientNote = clientNote;

        const updatedConfig = await updateSubscriptionConfig(updateData);

        // ── Write history entry ──
        await prisma.subscriptionHistory.create({
            data: {
                changedByStaffId: changedBy?.id ?? null,
                changedByName: changedBy?.username ?? 'developer',
                action: actions.join(','),
                previousStatus: currentConfig.subscriptionStatus,
                newStatus: updatedConfig.subscriptionStatus,
                previousExpiresAt: currentConfig.subscriptionExpiresAt,
                newExpiresAt: updatedConfig.subscriptionExpiresAt,
                paymentCycle: updatedConfig.paymentCycle,
                isNeverEnd: updatedConfig.isNeverEnd,
                isSystemDisabled: updatedConfig.isSystemDisabled,
                note: historyNote ?? null,
            },
        });

        // ── Recalculate daysRemaining ──
        let daysRemaining: number | null = null;
        if (!updatedConfig.isNeverEnd && updatedConfig.subscriptionExpiresAt) {
            const diff = updatedConfig.subscriptionExpiresAt.getTime() - Date.now();
            daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        res.json({
            subscriptionStatus: updatedConfig.subscriptionStatus,
            paymentCycle: updatedConfig.paymentCycle,
            subscriptionExpiresAt: updatedConfig.subscriptionExpiresAt,
            isNeverEnd: updatedConfig.isNeverEnd,
            isSystemDisabled: updatedConfig.isSystemDisabled,
            clientNote: updatedConfig.clientNote,
            daysRemaining,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update subscription status' });
    }
};

// ─── Get Subscription History ─────────────────────────────────────────────────
// All authenticated users can see history (admin/manager read-only)

export const getSubscriptionHistory = async (_req: Request, res: Response) => {
    try {
        const history = await prisma.subscriptionHistory.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get subscription history' });
    }
};
