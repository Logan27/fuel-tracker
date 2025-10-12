import { Page } from '@playwright/test';
import { testUsers } from './test-data';

export class TestHelpers {
  static async loginAsTestUser(page: Page) {
    await page.goto('/auth');
    await page.fill('input[type="email"]', testUsers.valid.email);
    await page.fill('input[type="password"]', testUsers.valid.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard');
  }

  static async logout(page: Page) {
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('**/auth');
  }

  static async clearAllData(page: Page) {
    // This would typically call API endpoints to clear test data
    // For now, we'll just clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  static async waitForNetworkIdle(page: Page, timeout = 5000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  static async waitForElementToBeVisible(page: Page, selector: string, timeout = 5000) {
    await page.waitForSelector(selector, { state: 'visible', timeout });
  }

  static async waitForElementToBeHidden(page: Page, selector: string, timeout = 5000) {
    await page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  static async getTextContent(page: Page, selector: string) {
    const element = await page.locator(selector).first();
    return await element.textContent();
  }

  static async isElementVisible(page: Page, selector: string) {
    const element = await page.locator(selector).first();
    return await element.isVisible();
  }

  static async getElementCount(page: Page, selector: string) {
    const elements = await page.locator(selector).all();
    return elements.length;
  }

  static async fillFormField(page: Page, name: string, value: string) {
    const field = page.locator(`[name="${name}"]`);
    await field.fill(value);
  }

  static async selectOption(page: Page, name: string, value: string) {
    const select = page.locator(`[name="${name}"]`);
    await select.selectOption(value);
  }

  static async clickButton(page: Page, text: string) {
    await page.click(`button:has-text("${text}")`);
  }

  static async clickLink(page: Page, text: string) {
    await page.click(`a:has-text("${text}")`);
  }

  static async waitForUrl(page: Page, urlPattern: string) {
    await page.waitForURL(urlPattern);
  }

  static async waitForSuccessMessage(page: Page) {
    await page.waitForSelector('[data-testid="success-message"]', { 
      state: 'visible',
      timeout: 5000 
    });
  }

  static async waitForErrorMessage(page: Page) {
    await page.waitForSelector('[data-testid="error-message"]', { 
      state: 'visible',
      timeout: 5000 
    });
  }

  static async waitForLoadingToFinish(page: Page) {
    await page.waitForSelector('[data-testid="loading-spinner"]', { 
      state: 'hidden',
      timeout: 10000 
    });
  }
}


