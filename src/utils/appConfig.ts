import prisma from './prisma';

const APP_CONFIG_KEY = 'app';

export const getAppConfig = async () => {
    const existing = await prisma.appConfig.findUnique({ where: { key: APP_CONFIG_KEY } });
    if (existing) return existing;
    return prisma.appConfig.create({
        data: {
            key: APP_CONFIG_KEY,
            subscriptionStatus: 'active'
        }
    });
};

export const setSubscriptionStatus = async (status: 'active' | 'past_due' | 'blocked' | 'canceled') => {
    return prisma.appConfig.upsert({
        where: { key: APP_CONFIG_KEY },
        update: { subscriptionStatus: status },
        create: { key: APP_CONFIG_KEY, subscriptionStatus: status }
    });
};
