const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3001';
const ACCOUNT_ID = 2;
const CONVERSATION_ID = 3;

test.describe('Auto-scroll with "New messages" button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/accounts/${ACCOUNT_ID}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  async function navigateToConversation(page) {
    await page.goto(`${BASE_URL}/app/accounts/${ACCOUNT_ID}/conversations/${CONVERSATION_ID}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const panel = page.locator('.conversation-panel');
    await expect(panel).toBeVisible({ timeout: 10000 });
    return panel;
  }

  async function injectMessage(page, content) {
    const result = await page.evaluate(({ msgContent, convId }) => {
      const app = document.querySelector('#app')?.__vue_app__;
      if (!app) return { success: false, error: 'no vue app' };
      const store = app.config.globalProperties.$store;
      const chat = store.getters.getSelectedChat;
      if (!chat) return { success: false, error: 'no selected chat' };
      const fakeMessage = {
        id: Date.now(),
        content: msgContent,
        content_type: 'text',
        conversation_id: convId,
        message_type: 0,
        created_at: new Date().toISOString(),
        sender: { id: 1, name: 'Test User', type: 'contact' },
        status: 'sent',
        source_id: null,
        attachments: [],
        metadata: [],
      };
      store.commit('ADD_MESSAGE', fakeMessage);
      return { success: true, chatId: chat.id };
    }, { msgContent: content, convId: CONVERSATION_ID });
    if (!result.success) throw new Error(`injectMessage failed: ${result.error}`);
    return result;
  }

  test('should load conversation with message panel', async ({ page }) => {
    const panel = await navigateToConversation(page);
    await expect(panel).toBeVisible();
  });

  test('should not show "New messages" button when at the bottom', async ({ page }) => {
    const panel = await navigateToConversation(page);
    const scrollBtn = page.locator('button:has-text("New messages")');
    await expect(scrollBtn).not.toBeVisible({ timeout: 5000 });
  });

  test('should show "New messages" button after scrolling up and new message arrives', async ({ page }) => {
    const panel = await navigateToConversation(page);
    await panel.evaluate(el => { el.scrollTop = 0; });
    await page.waitForTimeout(500);
    await injectMessage(page, 'New message while scrolled up');
    await page.waitForTimeout(1000);
    const scrollBtn = page.locator('button:has-text("New messages")');
    await expect(scrollBtn).toBeVisible({ timeout: 5000 });
  });

  test('should scroll to bottom and hide button on click', async ({ page }) => {
    const panel = await navigateToConversation(page);
    await panel.evaluate(el => { el.scrollTop = 0; });
    await page.waitForTimeout(500);
    await injectMessage(page, 'Test message for scroll-to-bottom');
    await page.waitForTimeout(1000);

    const scrollBtn = page.locator('button:has-text("New messages")');
    await expect(scrollBtn).toBeVisible({ timeout: 5000 });
    await scrollBtn.click();
    await page.waitForTimeout(1000);
    await expect(scrollBtn).not.toBeVisible({ timeout: 5000 });

    const isAtBottom = await panel.evaluate(el => {
      return el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
    });
    expect(isAtBottom).toBeTruthy();
  });

  test('should stay at bottom when following and new messages arrive', async ({ page }) => {
    const panel = await navigateToConversation(page);
    await page.waitForTimeout(1000);

    for (let i = 0; i < 3; i++) {
      await injectMessage(page, `Follow test message ${i}`);
      await page.waitForTimeout(500);
    }

    const scrollBtn = page.locator('button:has-text("New messages")');
    await expect(scrollBtn).not.toBeVisible({ timeout: 5000 });

    const isAtBottom = await panel.evaluate(el => {
      return el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
    });
    expect(isAtBottom).toBeTruthy();
  });
});
