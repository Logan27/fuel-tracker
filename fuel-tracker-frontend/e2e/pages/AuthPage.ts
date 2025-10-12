import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AuthPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;
  readonly signUpLink: Locator;
  readonly signInLink: Locator;
  readonly formError: Locator;
  readonly loadingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    this.signInButton = page.locator('button:has-text("Sign In")');
    this.signUpButton = page.locator('button:has-text("Sign Up")');
    this.signUpLink = page.locator('a:has-text("Sign Up")');
    this.signInLink = page.locator('a:has-text("Sign In")');
    this.formError = page.locator('[role="alert"]');
    this.loadingButton = page.locator('button[disabled]');
  }

  async gotoSignIn() {
    await this.goto('/auth');
    await this.page.waitForSelector('input[type="email"]');
  }

  async gotoSignUp() {
    await this.goto('/auth');
    await this.page.waitForSelector('input[type="email"]');
    await this.signUpLink.click();
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    await this.waitForLoadingToFinish();
  }

  async signUp(email: string, password: string, confirmPassword?: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (confirmPassword) {
      await this.confirmPasswordInput.fill(confirmPassword);
    }
    await this.signUpButton.click();
    await this.waitForLoadingToFinish();
  }

  async isSignedIn() {
    // Check if we're redirected to dashboard or if user menu is visible
    return this.page.url().includes('/dashboard') || 
           this.page.locator('[data-testid="user-menu"]').isVisible();
  }

  async getFormError() {
    return await this.formError.textContent();
  }

  async isFormValid() {
    return !(await this.formError.isVisible());
  }

  async waitForSignInSuccess() {
    await this.page.waitForURL('**/dashboard');
  }

  async waitForSignUpSuccess() {
    await this.page.waitForURL('**/dashboard');
  }
}


