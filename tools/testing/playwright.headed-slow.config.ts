import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig(baseConfig, {
    fullyParallel: false,
    workers: 1,
    use: {
        ...baseConfig.use,
        headless: false,
        launchOptions: {
            slowMo: 300
        }
    }
});
