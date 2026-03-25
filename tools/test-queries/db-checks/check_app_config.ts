import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const appConfigs = await prisma.appConfig.findMany({
        orderBy: { key: 'asc' }
    });

    const plans = await prisma.subscriptionPlan.findMany({
        orderBy: { id: 'asc' }
    });

    console.log('AppConfig rows:');
    console.log(JSON.stringify(appConfigs, null, 2));

    console.log('\nSubscription plans (summary):');
    console.log(
        JSON.stringify(
            plans.map((plan) => ({
                id: plan.id,
                name: plan.name,
                price: plan.price,
                duration: plan.duration,
                active: plan.active
            })),
            null,
            2
        )
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
