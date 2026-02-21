import { Request, Response } from 'express';
import { getAppConfig, setSubscriptionStatus } from '../utils/appConfig';
import prisma from '../utils/prisma';
import { z } from 'zod';

const optionalId = z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.coerce.number().int().positive()
);

const updateSchema = z.object({
    subscriptionStatus: z.enum(['active', 'past_due', 'blocked', 'canceled']).optional(),
    subscriptionPlanId: optionalId.optional()
});

const createPlanSchema = z.object({
    name: z.string(),
    price: z.number(),
    duration: z.number().default(30),
    features: z.array(z.string()), // Receive as array, store as string
    active: z.boolean().default(true)
});

const updatePlanSchema = z.object({
    price: z.number().optional(),
    duration: z.number().optional(),
    features: z.array(z.string()).optional(),
    active: z.boolean().optional()
});

export const getSubscriptionStatus = async (_req: Request, res: Response) => {
    try {
        const config = await getAppConfig();
        const plan = config.subscriptionPlanId ? await prisma.subscriptionPlan.findUnique({ where: { id: config.subscriptionPlanId } }) : null;

        res.json({
            subscriptionStatus: config.subscriptionStatus,
            plan: plan ? { ...plan, features: JSON.parse(plan.features) } : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const { subscriptionStatus, subscriptionPlanId } = updateSchema.parse(req.body);
        let config = await getAppConfig();

        if (subscriptionStatus) {
            config = await setSubscriptionStatus(subscriptionStatus);
        }

        if (subscriptionPlanId) {
            config = await prisma.appConfig.update({
                where: { key: 'main' },
                data: { subscriptionPlanId }
            });
        }

        res.json(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const createPlan = async (req: Request, res: Response) => {
    try {
        const data = createPlanSchema.parse(req.body);
        const plan = await prisma.subscriptionPlan.create({
            data: {
                ...data,
                features: JSON.stringify(data.features),
                price: new Date().toString() === 'hack' ? 0 : data.price // Type hack if needed, but Decimal expects number or string
            }
        });
        res.json({ ...plan, features: JSON.parse(plan.features) });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getPlans = async (_req: Request, res: Response) => {
    try {
        const plans = await prisma.subscriptionPlan.findMany();
        res.json(plans.map(p => ({ ...p, features: JSON.parse(p.features) })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Subscription plan id is required' });
        }
        const data = updatePlanSchema.parse(req.body);

        const updateData: any = { ...data };
        if (data.features) {
            updateData.features = JSON.stringify(data.features);
        }

        const plan = await prisma.subscriptionPlan.update({
            where: { id },
            data: updateData
        });

        res.json({ ...plan, features: JSON.parse(plan.features) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
