import { expect, test } from '@playwright/test';

test('opens login page and supports typing + demo credential clicks', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    const usernameInput = page.getByPlaceholder('admin');
    const passwordInput = page.locator('input[type="password"]');

    await usernameInput.click();
    await usernameInput.type('manager', { delay: 75 });
    await expect(usernameInput).toHaveValue('manager');

    await passwordInput.click();
    await passwordInput.type('manager123', { delay: 75 });
    await expect(passwordInput).toHaveValue('manager123');

    await page.getByRole('button', { name: 'Super Admin' }).click();
    await expect(usernameInput).toHaveValue('superadmin');
    await expect(passwordInput).toHaveValue('admin123');

    await page.getByRole('button', { name: 'Cashier' }).click();
    await expect(usernameInput).toHaveValue('cashier');
    await expect(passwordInput).toHaveValue('cashier123');

    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});
