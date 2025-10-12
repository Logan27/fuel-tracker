import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehicleFormPage } from './pages/VehicleFormPage';
import { FuelEntryFormPage } from './pages/FuelEntryFormPage';
import { testUsers, testVehicles, testFuelEntries } from './fixtures/test-data';

test.describe('Sign Up Flow', () => {
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

  test('Complete sign up flow: Sign Up → Add Vehicle → Add Fuel Entry → View Dashboard', async ({ page }) => {
    // Step 1: Sign Up
    await test.step('Sign Up with new user', async () => {
      await authPage.gotoSignUp();
      await authPage.signUp(
        testUsers.newUser.email,
        testUsers.newUser.password,
        testUsers.newUser.confirmPassword
      );
      await authPage.waitForSignUpSuccess();
    });

    // Step 2: Add Vehicle
    await test.step('Add first vehicle', async () => {
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

    // Step 3: Add Fuel Entry
    await test.step('Add first fuel entry', async () => {
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

    // Step 4: View Dashboard
    await test.step('Verify dashboard shows data', async () => {
      await dashboardPage.goto();
      await dashboardPage.waitForDataToLoad();
      
      // Verify vehicle is visible
      expect(await dashboardPage.isVehicleVisible(
        testVehicles.toyota.make, 
        testVehicles.toyota.model
      )).toBeTruthy();
      
      // Verify fuel entry is visible
      expect(await dashboardPage.isFuelEntryVisible(
        `${testVehicles.toyota.make} ${testVehicles.toyota.model}`,
        testFuelEntries.valid.date
      )).toBeTruthy();
      
      // Verify statistics are displayed
      const stats = await dashboardPage.getStatistics();
      expect(stats).toBeDefined();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });
  });

  test('Sign up with invalid data should show validation errors', async ({ page }) => {
    await test.step('Try to sign up with invalid email', async () => {
      await authPage.gotoSignUp();
      await authPage.signUp(
        testUsers.invalid.email,
        testUsers.invalid.password,
        testUsers.invalid.password
      );
      
      // Should show validation errors
      expect(await authPage.isFormValid()).toBeFalsy();
      const error = await authPage.getFormError();
      expect(error).toContain('email');
    });
  });

  test('Sign up with mismatched passwords should show error', async ({ page }) => {
    await test.step('Try to sign up with mismatched passwords', async () => {
      await authPage.gotoSignUp();
      await authPage.signUp(
        testUsers.newUser.email,
        testUsers.newUser.password,
        'different-password'
      );
      
      // Should show validation errors
      expect(await authPage.isFormValid()).toBeFalsy();
      const error = await authPage.getFormError();
      expect(error).toContain('password');
    });
  });

  test('Sign up with existing email should show error', async ({ page }) => {
    await test.step('Try to sign up with existing email', async () => {
      await authPage.gotoSignUp();
      await authPage.signUp(
        testUsers.valid.email, // This email already exists
        testUsers.newUser.password,
        testUsers.newUser.confirmPassword
      );
      
      // Should show error message
      await authPage.waitForErrorMessage();
      const error = await authPage.getFormError();
      expect(error).toContain('email');
    });
  });
});


