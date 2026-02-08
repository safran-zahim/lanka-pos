import { Request, Response } from 'express';
import { getAppConfig, setSubscriptionStatus } from '../utils/appConfig';
import { z } from 'zod';

const updateSchema = z.object({
    subscriptionStatus: z.enum(['active', 'past_due', 'blocked', 'canceled'])
});

export const getSubscriptionStatus = async (_req: Request, res: Response) => {
    try {
        const config = await getAppConfig();
        res.json({ subscriptionStatus: config.subscriptionStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const { subscriptionStatus } = updateSchema.parse(req.body);
        const updated = await setSubscriptionStatus(subscriptionStatus);
        res.json({ subscriptionStatus: updated.subscriptionStatus });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
