import prisma from './prisma';

const APP_CONFIG_KEY = 'app';

export const getAppConfig = async () => {
    const existing = await prisma.appConfig.findUnique({ where: { key: APP_CONFIG_KEY } });
    if (existing) return existing;
    return prisma.appConfig.create({
        data: {
            key: APP_CONFIG_KEY,
            subscriptionStatus: 'active',
            paymentCycle: 'monthly',
            isNeverEnd: false,
            isSystemDisabled: false
        }
    });
};

export const updateSubscriptionConfig = async (data: {
    subscriptionStatus?: string;
    paymentCycle?: string;
    subscriptionExpiresAt?: Date | null;
    isNeverEnd?: boolean;
    isSystemDisabled?: boolean;
    clientNote?: string | null;
}) => {
    return prisma.appConfig.upsert({
        where: { key: APP_CONFIG_KEY },
        update: data,
        create: {
            key: APP_CONFIG_KEY,
            subscriptionStatus: data.subscriptionStatus || 'active',
            paymentCycle: data.paymentCycle || 'monthly',
            ...data
        }
    });
};

/**
 * Returns true if the subscription is currently valid for non-developer users.
 * Called ONLY at login time.
 */
export const isSubscriptionValid = (config: {
    subscriptionStatus: string;
    isSystemDisabled: boolean;
    isNeverEnd: boolean;
    subscriptionExpiresAt: Date | null;
}): { valid: boolean; reason?: string } => {
    if (config.isSystemDisabled) {
        return { valid: false, reason: 'The system has been disabled by the developer. Please contact your system administrator.' };
    }
    if (config.subscriptionStatus === 'blocked' || config.subscriptionStatus === 'canceled') {
        return { valid: false, reason: 'System subscription is inactive. Please contact your developer to activate the system.' };
    }
    if (!config.isNeverEnd && config.subscriptionExpiresAt) {
        if (new Date() > config.subscriptionExpiresAt) {
            return { valid: false, reason: 'System subscription has expired. Please contact your developer to renew.' };
        }
    }
    return { valid: true };
};
