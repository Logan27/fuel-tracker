import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly addVehicleButton: Locator;
  readonly addFuelEntryButton: Locator;
  readonly vehiclesSection: Locator;
  readonly fuelEntriesSection: Locator;
  readonly statisticsCards: Locator;
  readonly charts: Locator;
  readonly userMenu: Locator;
  readonly signOutButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.addVehicleButton = page.locator('button:has-text("Add Vehicle")');
    this.addFuelEntryButton = page.locator('button:has-text("Add Fuel Entry")');
    this.vehiclesSection = page.locator('[data-testid="vehicles-section"]');
    this.fuelEntriesSection = page.locator('[data-testid="fuel-entries-section"]');
    this.statisticsCards = page.locator('[data-testid="statistics-cards"]');
    this.charts = page.locator('[data-testid="charts"]');
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.signOutButton = page.locator('button:has-text("Sign Out")');
    this.emptyState = page.locator('[data-testid="empty-state"]');
  }

  async goto() {
    await this.goto('/dashboard');
    await this.page.waitForSelector('[data-testid="dashboard-content"]');
  }

  async addVehicle() {
    await this.addVehicleButton.click();
    await this.page.waitForSelector('[data-testid="vehicle-form"]');
  }

  async addFuelEntry() {
    await this.addFuelEntryButton.click();
    await this.page.waitForSelector('[data-testid="fuel-entry-form"]');
  }

  async signOut() {
    await this.userMenu.click();
    await this.signOutButton.click();
    await this.page.waitForURL('**/auth');
  }

  async getVehicleCount() {
    const vehicles = await this.page.locator('[data-testid="vehicle-card"]').count();
    return vehicles;
  }

  async getFuelEntryCount() {
    const entries = await this.page.locator('[data-testid="fuel-entry-card"]').count();
    return entries;
  }

  async getStatistics() {
    const stats = await this.statisticsCards.locator('[data-testid="stat-card"]').all();
    const statistics: Record<string, string> = {};
    
    for (const stat of stats) {
      const label = await stat.locator('[data-testid="stat-label"]').textContent();
      const value = await stat.locator('[data-testid="stat-value"]').textContent();
      if (label && value) {
        statistics[label] = value;
      }
    }
    
    return statistics;
  }

  async isVehicleVisible(make: string, model: string) {
    const vehicleCard = this.page.locator(`[data-testid="vehicle-card"]:has-text("${make} ${model}")`);
    return await vehicleCard.isVisible();
  }

  async isFuelEntryVisible(vehicle: string, date: string) {
    const entryCard = this.page.locator(`[data-testid="fuel-entry-card"]:has-text("${vehicle}")`).first();
    return await entryCard.isVisible();
  }

  async waitForDataToLoad() {
    await this.page.waitForSelector('[data-testid="statistics-cards"]');
    await this.waitForLoadingToFinish();
  }
}


