"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveSubscription = exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const appConfig_1 = require("../utils/appConfig");
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const decoded = (0, jwt_1.verifyToken)(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
};
exports.authorize = authorize;
const requireActiveSubscription = async (req, res, next) => {
    try {
        if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
            return next();
        }
        const config = await (0, appConfig_1.getAppConfig)();
        if (config.subscriptionStatus !== 'active') {
            return res.status(402).json({ error: 'Subscription inactive' });
        }
        next();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requireActiveSubscription = requireActiveSubscription;
