import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehicleFormPage } from './pages/VehicleFormPage';
import { FuelEntryFormPage } from './pages/FuelEntryFormPage';
import { testUsers, testVehicles, testFuelEntries } from './fixtures/test-data';

test.describe('Sign In Flow', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;
  let vehicleFormPage: VehicleFormPage;
  let fuelEntryFormPage: FuelEntryFormPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
    vehicleFormPage = new VehicleFormPage(page);
    fuelEntryFormPage = new FuelEntryFormPage(page);
  });

  test('Complete sign in flow: Sign In → Edit Entry → View Statistics → Sign Out', async ({ page }) => {
    // Step 1: Sign In
    await test.step('Sign in with valid credentials', async () => {
      await authPage.gotoSignIn();
      await authPage.signIn(testUsers.valid.email, testUsers.valid.password);
      await authPage.waitForSignInSuccess();
    });

    // Step 2: Add a vehicle first (if not exists)
    await test.step('Ensure vehicle exists', async () => {
      await dashboardPage.goto();
      const vehicleCount = await dashboardPage.getVehicleCount();
      
      if (vehicleCount === 0) {
        await dashboardPage.addVehicle();
        await vehicleFormPage.fillForm(
          testVehicles.honda.make,
          testVehicles.honda.model,
          testVehicles.honda.year
        );
        await vehicleFormPage.submit();
        await vehicleFormPage.waitForRedirect();
      }
    });

    // Step 3: Add a fuel entry
    await test.step('Add fuel entry', async () => {
      await dashboardPage.goto();
      await dashboardPage.addFuelEntry();
      
      await fuelEntryFormPage.fillForm(
        `${testVehicles.honda.make} ${testVehicles.honda.model}`,
        testFuelEntries.valid.date,
        testFuelEntries.valid.odometer,
        testFuelEntries.valid.fuelAmount,
        testFuelEntries.valid.pricePerLiter
      );
      await fuelEntryFormPage.submit();
      await fuelEntryFormPage.waitForRedirect();
    });

    // Step 4: Edit the fuel entry
    await test.step('Edit fuel entry', async () => {
      await dashboardPage.goto();
      
      // Find and click on the fuel entry to edit
      const fuelEntryCard = page.locator('[data-testid="fuel-entry-card"]').first();
      await fuelEntryCard.click();
      
      // Wait for edit form or modal
      await page.waitForSelector('[data-testid="fuel-entry-form"]');
      
      // Update the fuel amount
      await page.fill('input[name="fuel_amount"]', '55.0');
      await page.click('button:has-text("Update")');
      
      // Wait for success
      await page.waitForSelector('[data-testid="success-message"]');
    });

    // Step 5: View Statistics
    await test.step('View statistics on dashboard', async () => {
      await dashboardPage.goto();
      await dashboardPage.waitForDataToLoad();
      
      // Verify statistics are displayed
      const stats = await dashboardPage.getStatistics();
      expect(stats).toBeDefined();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
      
      // Verify specific statistics
      expect(stats['Total Vehicles']).toBeDefined();
      expect(stats['Total Fuel Entries']).toBeDefined();
      expect(stats['Total Distance']).toBeDefined();
    });

    // Step 6: Sign Out
    await test.step('Sign out', async () => {
      await dashboardPage.signOut();
      expect(await page.url()).toContain('/auth');
    });
  });

  test('Sign in with invalid credentials should show error', async ({ page }) => {
    await test.step('Try to sign in with invalid credentials', async () => {
      await authPage.gotoSignIn();
      await authPage.signIn(
        testUsers.invalid.email,
        testUsers.invalid.password
      );
      
      // Should show error message
      await authPage.waitForErrorMessage();
      const error = await authPage.getFormError();
      expect(error).toContain('Invalid');
    });
  });

  test('Sign in with non-existent user should show error', async ({ page }) => {
    await test.step('Try to sign in with non-existent user', async () => {
      await authPage.gotoSignIn();
      await authPage.signIn(
        'nonexistent@example.com',
        'password123'
      );
      
      // Should show error message
      await authPage.waitForErrorMessage();
      const error = await authPage.getFormError();
      expect(error).toContain('Invalid');
    });
  });

  test('Sign in with empty fields should show validation errors', async ({ page }) => {
    await test.step('Try to sign in with empty fields', async () => {
      await authPage.gotoSignIn();
      await authPage.signIn('', '');
      
      // Should show validation errors
      expect(await authPage.isFormValid()).toBeFalsy();
      const error = await authPage.getFormError();
      expect(error).toContain('required');
    });
  });

  test('Dashboard should be accessible after sign in', async ({ page }) => {
    await test.step('Sign in and verify dashboard access', async () => {
      await authPage.gotoSignIn();
      await authPage.signIn(testUsers.valid.email, testUsers.valid.password);
      await authPage.waitForSignInSuccess();
      
      // Verify we're on dashboard
      expect(await page.url()).toContain('/dashboard');
      
      // Verify dashboard elements are visible
      await dashboardPage.goto();
      expect(await dashboardPage.addVehicleButton.isVisible()).toBeTruthy();
      expect(await dashboardPage.addFuelEntryButton.isVisible()).toBeTruthy();
    });
  });

  test('User should be redirected to auth page when not signed in', async ({ page }) => {
    await test.step('Try to access dashboard without authentication', async () => {
      await page.goto('/dashboard');
      
      // Should be redirected to auth page
      expect(await page.url()).toContain('/auth');
    });
  });
});


