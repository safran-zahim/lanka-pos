import { expect, test } from '@playwright/test';

test('protected route redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByPlaceholder('admin')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('demo credentials button populates login form', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Super Admin' }).click();
    await expect(page.getByPlaceholder('admin')).toHaveValue('superadmin');
    await expect(page.locator('input[type="password"]')).toHaveValue('admin123');

    await page.getByRole('button', { name: 'Cashier' }).click();
    await expect(page.getByPlaceholder('admin')).toHaveValue('cashier');
    await expect(page.locator('input[type="password"]')).toHaveValue('cashier123');
});
