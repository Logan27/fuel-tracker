import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class FuelEntryFormPage extends BasePage {
  readonly vehicleSelect: Locator;
  readonly dateInput: Locator;
  readonly odometerInput: Locator;
  readonly fuelAmountInput: Locator;
  readonly pricePerLiterInput: Locator;
  readonly totalCostInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly formError: Locator;
  readonly loadingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.vehicleSelect = page.locator('select[name="vehicle"]');
    this.dateInput = page.locator('input[type="date"]');
    this.odometerInput = page.locator('input[name="odometer"]');
    this.fuelAmountInput = page.locator('input[name="fuel_amount"]');
    this.pricePerLiterInput = page.locator('input[name="price_per_liter"]');
    this.totalCostInput = page.locator('input[name="total_cost"]');
    this.submitButton = page.locator('button:has-text("Add Fuel Entry")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.formError = page.locator('[role="alert"]');
    this.loadingButton = page.locator('button[disabled]');
  }

  async goto() {
    await this.goto('/fuel-entries/new');
    await this.page.waitForSelector('select[name="vehicle"]');
  }

  async fillForm(vehicle: string, date: string, odometer: number, fuelAmount: number, pricePerLiter: number) {
    await this.vehicleSelect.selectOption(vehicle);
    await this.dateInput.fill(date);
    await this.odometerInput.fill(odometer.toString());
    await this.fuelAmountInput.fill(fuelAmount.toString());
    await this.pricePerLiterInput.fill(pricePerLiter.toString());
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
    await this.page.waitForURL('**/fuel-entries');
  }

  async waitForRedirect() {
    await this.page.waitForURL('**/dashboard');
  }

  async getAvailableVehicles() {
    const options = await this.vehicleSelect.locator('option').all();
    return await Promise.all(options.map(option => option.textContent()));
  }
}


