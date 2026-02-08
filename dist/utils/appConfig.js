"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSubscriptionStatus = exports.getAppConfig = void 0;
const prisma_1 = __importDefault(require("./prisma"));
const APP_CONFIG_KEY = 'app';
const getAppConfig = async () => {
    const existing = await prisma_1.default.appConfig.findUnique({ where: { key: APP_CONFIG_KEY } });
    if (existing)
        return existing;
    return prisma_1.default.appConfig.create({
        data: {
            key: APP_CONFIG_KEY,
            subscriptionStatus: 'active'
        }
    });
};
exports.getAppConfig = getAppConfig;
const setSubscriptionStatus = async (status) => {
    return prisma_1.default.appConfig.upsert({
        where: { key: APP_CONFIG_KEY },
        update: { subscriptionStatus: status },
        create: { key: APP_CONFIG_KEY, subscriptionStatus: status }
    });
};
exports.setSubscriptionStatus = setSubscriptionStatus;
