import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { getAppConfig } from '../utils/appConfig';

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
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
};

export const requireActiveSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
            return next();
        }
        const config = await getAppConfig();
        if (config.subscriptionStatus !== 'active') {
            return res.status(402).json({ error: 'Subscription inactive' });
        }
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
