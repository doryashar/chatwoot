const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3001';
const EMAIL = 'admin@example.com';
const PASSWORD = 'Password1!';

test('authenticate and save session', async ({ page }) => {
  await page.goto(`${BASE_URL}/app/login`);
  await page.getByTestId('email_input').fill(EMAIL);
  await page.getByTestId('password_input').fill(PASSWORD);
  await page.getByTestId('submit_button').click();
  await page.waitForURL(/\/app\/accounts\/\d+/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.context().storageState({ path: '.auth/user.json' });
});
