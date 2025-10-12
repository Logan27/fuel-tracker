import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class VehicleFormPage extends BasePage {
  readonly makeInput: Locator;
  readonly modelInput: Locator;
  readonly yearSelect: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly formError: Locator;
  readonly loadingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.makeInput = page.locator('input[name="make"]');
    this.modelInput = page.locator('input[name="model"]');
    this.yearSelect = page.locator('select[name="year"]');
    this.submitButton = page.locator('button:has-text("Add Vehicle")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.formError = page.locator('[role="alert"]');
    this.loadingButton = page.locator('button[disabled]');
  }

  async goto() {
    await this.goto('/vehicles/new');
    await this.page.waitForSelector('input[name="make"]');
  }

  async fillForm(make: string, model: string, year: number) {
    await this.makeInput.fill(make);
    await this.modelInput.fill(model);
    await this.yearSelect.selectOption(year.toString());
  }

  async submit() {
    await this.submitButton.click();
    await this.waitForLoadingToFinish();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async getFormError() {
    return await this.formError.textContent();
  }

  async isFormValid() {
    return !(await this.formError.isVisible());
  }

  async waitForSuccess() {
    await this.page.waitForURL('**/vehicles');
  }

  async waitForRedirect() {
    await this.page.waitForURL('**/dashboard');
  }
}


