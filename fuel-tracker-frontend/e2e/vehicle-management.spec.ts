import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehicleFormPage } from './pages/VehicleFormPage';
import { testUsers, testVehicles } from './fixtures/test-data';

test.describe('Vehicle Management', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;
  let vehicleFormPage: VehicleFormPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
    vehicleFormPage = new VehicleFormPage(page);
    
    // Sign in before each test
    await authPage.gotoSignIn();
    await authPage.signIn(testUsers.valid.email, testUsers.valid.password);
    await authPage.waitForSignInSuccess();
  });

  test('Add vehicle with valid data', async ({ page }) => {
    await test.step('Add new vehicle', async () => {
      await dashboardPage.goto();
      await dashboardPage.addVehicle();
      
      await vehicleFormPage.fillForm(
        testVehicles.toyota.make,
        testVehicles.toyota.model,
        testVehicles.toyota.year
      );
      await vehicleFormPage.submit();
      await vehicleFormPage.waitForRedirect();
    });

    await test.step('Verify vehicle was added', async () => {
      await dashboardPage.goto();
      expect(await dashboardPage.isVehicleVisible(
        testVehicles.toyota.make,
        testVehicles.toyota.model
      )).toBeTruthy();
    });
  });

  test('Add vehicle with invalid data should show validation errors', async ({ page }) => {
    await test.step('Try to add vehicle with invalid data', async () => {
      await dashboardPage.goto();
      await dashboardPage.addVehicle();
      
      await vehicleFormPage.fillForm(
        testVehicles.invalid.make,
        testVehicles.invalid.model,
        testVehicles.invalid.year
      );
      await vehicleFormPage.submit();
      
      // Should show validation errors
      expect(await vehicleFormPage.isFormValid()).toBeFalsy();
      const error = await vehicleFormPage.getFormError();
      expect(error).toContain('required');
    });
  });

  test('Add multiple vehicles', async ({ page }) => {
    const vehicles = [testVehicles.toyota, testVehicles.honda, testVehicles.bmw];
    
    for (const vehicle of vehicles) {
      await test.step(`Add ${vehicle.make} ${vehicle.model}`, async () => {
        await dashboardPage.goto();
        await dashboardPage.addVehicle();
        
        await vehicleFormPage.fillForm(
          vehicle.make,
          vehicle.model,
          vehicle.year
        );
        await vehicleFormPage.submit();
        await vehicleFormPage.waitForRedirect();
      });
    }

    await test.step('Verify all vehicles are visible', async () => {
      await dashboardPage.goto();
      
      for (const vehicle of vehicles) {
        expect(await dashboardPage.isVehicleVisible(
          vehicle.make,
          vehicle.model
        )).toBeTruthy();
      }
      
      const vehicleCount = await dashboardPage.getVehicleCount();
      expect(vehicleCount).toBe(vehicles.length);
    });
  });

  test('Cancel vehicle form should return to dashboard', async ({ page }) => {
    await test.step('Cancel vehicle form', async () => {
      await dashboardPage.goto();
      await dashboardPage.addVehicle();
      
      await vehicleFormPage.cancel();
      await vehicleFormPage.waitForRedirect();
    });

    await test.step('Verify returned to dashboard', async () => {
      expect(await page.url()).toContain('/dashboard');
    });
  });

  test('Vehicle form should validate year range', async ({ page }) => {
    await test.step('Try to add vehicle with invalid year', async () => {
      await dashboardPage.goto();
      await dashboardPage.addVehicle();
      
      await vehicleFormPage.fillForm(
        testVehicles.toyota.make,
        testVehicles.toyota.model,
        1800 // Invalid year
      );
      await vehicleFormPage.submit();
      
      // Should show validation error
      expect(await vehicleFormPage.isFormValid()).toBeFalsy();
      const error = await vehicleFormPage.getFormError();
      expect(error).toContain('year');
    });
  });

  test('Vehicle form should validate required fields', async ({ page }) => {
    await test.step('Try to submit empty form', async () => {
      await dashboardPage.goto();
      await dashboardPage.addVehicle();
      
      await vehicleFormPage.submit();
      
      // Should show validation errors
      expect(await vehicleFormPage.isFormValid()).toBeFalsy();
      const error = await vehicleFormPage.getFormError();
      expect(error).toContain('required');
    });
  });
});


