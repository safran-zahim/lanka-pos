"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlan = exports.getPlans = exports.createPlan = exports.updateSubscriptionStatus = exports.getSubscriptionStatus = void 0;
const appConfig_1 = require("../utils/appConfig");
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const updateSchema = zod_1.z.object({
    subscriptionStatus: zod_1.z.enum(['active', 'past_due', 'blocked', 'canceled']).optional(),
    subscriptionPlanId: zod_1.z.string().optional()
});
const createPlanSchema = zod_1.z.object({
    name: zod_1.z.string(),
    price: zod_1.z.number(),
    duration: zod_1.z.number().default(30),
    features: zod_1.z.array(zod_1.z.string()), // Receive as array, store as string
    active: zod_1.z.boolean().default(true)
});
const updatePlanSchema = zod_1.z.object({
    price: zod_1.z.number().optional(),
    duration: zod_1.z.number().optional(),
    features: zod_1.z.array(zod_1.z.string()).optional(),
    active: zod_1.z.boolean().optional()
});
const getSubscriptionStatus = async (_req, res) => {
    try {
        const config = await (0, appConfig_1.getAppConfig)();
        const plan = config.subscriptionPlanId ? await prisma_1.default.subscriptionPlan.findUnique({ where: { id: config.subscriptionPlanId } }) : null;
        res.json({
            subscriptionStatus: config.subscriptionStatus,
            plan: plan ? { ...plan, features: JSON.parse(plan.features) } : null
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSubscriptionStatus = getSubscriptionStatus;
const updateSubscriptionStatus = async (req, res) => {
    try {
        const { subscriptionStatus, subscriptionPlanId } = updateSchema.parse(req.body);
        let config = await (0, appConfig_1.getAppConfig)();
        if (subscriptionStatus) {
            config = await (0, appConfig_1.setSubscriptionStatus)(subscriptionStatus);
        }
        if (subscriptionPlanId) {
            config = await prisma_1.default.appConfig.update({
                where: { key: 'main' },
                data: { subscriptionPlanId }
            });
        }
        res.json(config);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.errors });
        }
        else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.updateSubscriptionStatus = updateSubscriptionStatus;
const createPlan = async (req, res) => {
    try {
        const data = createPlanSchema.parse(req.body);
        const plan = await prisma_1.default.subscriptionPlan.create({
            data: {
                ...data,
                features: JSON.stringify(data.features),
                price: new Date().toString() === 'hack' ? 0 : data.price // Type hack if needed, but Decimal expects number or string
            }
        });
        res.json({ ...plan, features: JSON.parse(plan.features) });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.errors });
        }
        else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.createPlan = createPlan;
const getPlans = async (_req, res) => {
    try {
        const plans = await prisma_1.default.subscriptionPlan.findMany();
        res.json(plans.map(p => ({ ...p, features: JSON.parse(p.features) })));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getPlans = getPlans;
const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const data = updatePlanSchema.parse(req.body);
        const updateData = { ...data };
        if (data.features) {
            updateData.features = JSON.stringify(data.features);
        }
        const plan = await prisma_1.default.subscriptionPlan.update({
            where: { id },
            data: updateData
        });
        res.json({ ...plan, features: JSON.parse(plan.features) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updatePlan = updatePlan;
