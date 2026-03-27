import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { getAppConfig, isSubscriptionValid } from '../utils/appConfig';

interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = decoded;
    next();
};

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'super_admin')) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
};

/**
 * Blocks any non-super_admin API request if the subscription is invalid.
 * This is a safety net for mid-session requests after a subscription expires.
 */
export const requireActiveSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Developer (super_admin) is NEVER blocked — always bypass
        if (req.user?.role === 'super_admin') {
            return next();
        }

        const config = await getAppConfig();
        const check = isSubscriptionValid({
            subscriptionStatus: config.subscriptionStatus,
            isSystemDisabled: config.isSystemDisabled,
            isNeverEnd: config.isNeverEnd,
            subscriptionExpiresAt: config.subscriptionExpiresAt,
        });

        if (!check.valid) {
            return res.status(402).json({
                error: check.reason,
                code: 'SUBSCRIPTION_BLOCKED'
            });
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
