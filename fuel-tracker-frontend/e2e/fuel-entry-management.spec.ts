import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehicleFormPage } from './pages/VehicleFormPage';
import { FuelEntryFormPage } from './pages/FuelEntryFormPage';
import { testUsers, testVehicles, testFuelEntries } from './fixtures/test-data';

test.describe('Fuel Entry Management', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;
  let vehicleFormPage: VehicleFormPage;
  let fuelEntryFormPage: FuelEntryFormPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
    vehicleFormPage = new VehicleFormPage(page);
    fuelEntryFormPage = new FuelEntryFormPage(page);
    
    // Sign in before each test
    await authPage.gotoSignIn();
    await authPage.signIn(testUsers.valid.email, testUsers.valid.password);
    await authPage.waitForSignInSuccess();
    
    // Ensure we have a vehicle
    await dashboardPage.goto();
    const vehicleCount = await dashboardPage.getVehicleCount();
    if (vehicleCount === 0) {
      await dashboardPage.addVehicle();
      await vehicleFormPage.fillForm(
        testVehicles.toyota.make,
        testVehicles.toyota.model,
        testVehicles.toyota.year
      );
      await vehicleFormPage.submit();
      await vehicleFormPage.waitForRedirect();
    }
  });

  test('Add fuel entry with valid data', async ({ page }) => {
    await test.step('Add new fuel entry', async () => {
      await dashboardPage.goto();
      await dashboardPage.addFuelEntry();
      
      await fuelEntryFormPage.fillForm(
        `${testVehicles.toyota.make} ${testVehicles.toyota.model}`,
        testFuelEntries.valid.date,
        testFuelEntries.valid.odometer,
        testFuelEntries.valid.fuelAmount,
        testFuelEntries.valid.pricePerLiter
      );
      await fuelEntryFormPage.submit();
      await fuelEntryFormPage.waitForRedirect();
    });

    await test.step('Verify fuel entry was added', async () => {
      await dashboardPage.goto();
      expect(await dashboardPage.isFuelEntryVisible(
        `${testVehicles.toyota.make} ${testVehicles.toyota.model}`,
        testFuelEntries.valid.date
      )).toBeTruthy();
    });
  });

  test('Add fuel entry with invalid data should show validation errors', async ({ page }) => {
    await test.step('Try to add fuel entry with invalid data', async () => {
      await dashboardPage.goto();
      await dashboardPage.addFuelEntry();
      
      await fuelEntryFormPage.fillForm(
        `${testVehicles.toyota.make} ${testVehicles.toyota.model}`,
        testFuelEntries.invalid.date, // Future date
        testFuelEntries.invalid.odometer, // Lower than previous
        testFuelEntries.invalid.fuelAmount, // Negative
        testFuelEntries.invalid.pricePerLiter // Zero
      );
      await fuelEntryFormPage.submit();
      
      // Should show validation errors
      expect(await fuelEntryFormPage.isFormValid()).toBeFalsy();
      const error = await fuelEntryFormPage.getFormError();
      expect(error).toContain('invalid');
    });
  });

  test('Add multiple fuel entries for same vehicle', async ({ page }) => {
    const entries = [
      {
        ...testFuelEntries.valid,
        odometer: 10000,
        date: '2024-01-01'
      },
      {
        ...testFuelEntries.secondEntry,
        odometer: 10200,
        date: '2024-01-15'
      }
    ];
    
    for (const entry of entries) {
      await test.step(`Add fuel entry for ${entry.date}`, async () => {
        await dashboardPage.goto();
        await dashboardPage.addFuelEntry();
        
        await fuelEntryFormPage.fillForm(
          `${testVehicles.toyota.make} ${testVehicles.toyota.model}`,
          entry.date,
          entry.odometer,
          entry.fuelAmount,
          entry.pricePerLiter
        );
        await fuelEntryFormPage.submit();
        await fuelEntryFormPage.waitForRedirect();
      });
    }

    await test.step('Verify all fuel entries are visible', async () => {
      await dashboardPage.goto();
      
      for (const entry of entries) {
        expect(await dashboardPage.isFuelEntryVisible(
          `${testVehicles.toyota.make} ${testVehicles.toyota.model}`,
          entry.date
        )).toBeTruthy();
      }
      
      const entryCount = await dashboardPage.getFuelEntryCount();
      expect(entryCount).toBe(entries.length);
    });
  });

  test('Fuel entry form should validate odometer monotonicity', async ({ page }) => {
    // First add a fuel entry
    await test.step('Add first fuel entry', async () => {
      await dashboardPage.goto();
      await dashboardPage.addFuelEntry();
      
      await fuelEntryFormPage.fillForm(
        `${testVehicles.toyota.make} ${testVehicles.toyota.model}`,
        testFuelEntries.valid.date,
        10000,
        testFuelEntries.valid.fuelAmount,
        testFuelEntries.valid.pricePerLiter
      );
      await fuelEntryFormPage.submit();
      await fuelEntryFormPage.waitForRedirect();
    });

    // Then try to add another with lower odometer
    await test.step('Try to add fuel entry with lower odometer', async () => {
      await dashboardPage.goto();
      await dashboardPage.addFuelEntry();
      
      await fuelEntryFormPage.fillForm(
        `${testVehicles.toyota.make} ${testVehicles.toyota.model}`,
        '2024-01-15',
        9500, // Lower than previous
        testFuelEntries.valid.fuelAmount,
        testFuelEntries.valid.pricePerLiter
      );
      await fuelEntryFormPage.submit();
      
      // Should show validation error
      expect(await fuelEntryFormPage.isFormValid()).toBeFalsy();
      const error = await fuelEntryFormPage.getFormError();
      expect(error).toContain('odometer');
    });
  });

  test('Fuel entry form should validate future dates', async ({ page }) => {
    await test.step('Try to add fuel entry with future date', async () => {
      await dashboardPage.goto();
      await dashboardPage.addFuelEntry();
      
      await fuelEntryFormPage.fillForm(
        `${testVehicles.toyota.make} ${testVehicles.toyota.model}`,
        '2025-01-01', // Future date
        testFuelEntries.valid.odometer,
        testFuelEntries.valid.fuelAmount,
        testFuelEntries.valid.pricePerLiter
      );
      await fuelEntryFormPage.submit();
      
      // Should show validation error
      expect(await fuelEntryFormPage.isFormValid()).toBeFalsy();
      const error = await fuelEntryFormPage.getFormError();
      expect(error).toContain('date');
    });
  });

  test('Cancel fuel entry form should return to dashboard', async ({ page }) => {
    await test.step('Cancel fuel entry form', async () => {
      await dashboardPage.goto();
      await dashboardPage.addFuelEntry();
      
      await fuelEntryFormPage.cancel();
      await fuelEntryFormPage.waitForRedirect();
    });

    await test.step('Verify returned to dashboard', async () => {
      expect(await page.url()).toContain('/dashboard');
    });
  });

  test('Fuel entry form should show available vehicles', async ({ page }) => {
    await test.step('Check available vehicles in form', async () => {
      await dashboardPage.goto();
      await dashboardPage.addFuelEntry();
      
      const vehicles = await fuelEntryFormPage.getAvailableVehicles();
      expect(vehicles.length).toBeGreaterThan(0);
      expect(vehicles).toContain(`${testVehicles.toyota.make} ${testVehicles.toyota.model}`);
    });
  });
});


