import { test, expect, devices } from '@playwright/test';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { testUsers } from './fixtures/test-data';

test.describe('Responsive Design', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Sign in before each test
    await authPage.gotoSignIn();
    await authPage.signIn(testUsers.valid.email, testUsers.valid.password);
    await authPage.waitForSignInSuccess();
  });

  test('Dashboard should be responsive on mobile', async ({ page }) => {
    await test.step('Set mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    await test.step('Navigate to dashboard', async () => {
      await dashboardPage.goto();
      await dashboardPage.waitForDataToLoad();
    });

    await test.step('Verify mobile layout elements', async () => {
      // Check if mobile navigation is visible
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      expect(await mobileMenu.isVisible()).toBeTruthy();
      
      // Check if hamburger menu is visible
      const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
      expect(await hamburgerMenu.isVisible()).toBeTruthy();
      
      // Check if main content is visible
      const mainContent = page.locator('[data-testid="main-content"]');
      expect(await mainContent.isVisible()).toBeTruthy();
    });

    await test.step('Test mobile navigation', async () => {
      const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
      await hamburgerMenu.click();
      
      // Check if navigation menu is open
      const navMenu = page.locator('[data-testid="mobile-nav-menu"]');
      expect(await navMenu.isVisible()).toBeTruthy();
      
      // Check if navigation links are visible
      const navLinks = navMenu.locator('a');
      expect(await navLinks.count()).toBeGreaterThan(0);
    });
  });

  test('Dashboard should be responsive on tablet', async ({ page }) => {
    await test.step('Set tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    await test.step('Navigate to dashboard', async () => {
      await dashboardPage.goto();
      await dashboardPage.waitForDataToLoad();
    });

    await test.step('Verify tablet layout elements', async () => {
      // Check if desktop navigation is visible
      const desktopNav = page.locator('[data-testid="desktop-nav"]');
      expect(await desktopNav.isVisible()).toBeTruthy();
      
      // Check if mobile menu is hidden
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      expect(await mobileMenu.isVisible()).toBeFalsy();
      
      // Check if content is properly laid out
      const contentGrid = page.locator('[data-testid="content-grid"]');
      expect(await contentGrid.isVisible()).toBeTruthy();
    });
  });

  test('Dashboard should be responsive on desktop', async ({ page }) => {
    await test.step('Set desktop viewport', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    await test.step('Navigate to dashboard', async () => {
      await dashboardPage.goto();
      await dashboardPage.waitForDataToLoad();
    });

    await test.step('Verify desktop layout elements', async () => {
      // Check if desktop navigation is visible
      const desktopNav = page.locator('[data-testid="desktop-nav"]');
      expect(await desktopNav.isVisible()).toBeTruthy();
      
      // Check if sidebar is visible
      const sidebar = page.locator('[data-testid="sidebar"]');
      expect(await sidebar.isVisible()).toBeTruthy();
      
      // Check if main content area is properly sized
      const mainContent = page.locator('[data-testid="main-content"]');
      expect(await mainContent.isVisible()).toBeTruthy();
    });
  });

  test('Forms should be responsive on mobile', async ({ page }) => {
    await test.step('Set mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    await test.step('Test vehicle form on mobile', async () => {
      await dashboardPage.goto();
      await dashboardPage.addVehicle();
      
      // Check if form is properly displayed
      const form = page.locator('[data-testid="vehicle-form"]');
      expect(await form.isVisible()).toBeTruthy();
      
      // Check if form fields are properly sized
      const inputs = form.locator('input, select');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
      
      // Check if buttons are touch-friendly
      const buttons = form.locator('button');
      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44); // Minimum touch target size
      }
    });
  });

  test('Tables should be responsive on mobile', async ({ page }) => {
    await test.step('Set mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    await test.step('Navigate to fuel entries page', async () => {
      await page.goto('/fuel-entries');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify responsive table behavior', async () => {
      // Check if table is converted to cards on mobile
      const table = page.locator('table');
      const cards = page.locator('[data-testid="fuel-entry-card"]');
      
      if (await table.isVisible()) {
        // If table is visible, it should be horizontally scrollable
        const tableContainer = table.locator('..');
        const overflow = await tableContainer.evaluate(el => getComputedStyle(el).overflowX);
        expect(overflow).toBe('auto');
      } else {
        // If table is not visible, cards should be visible
        expect(await cards.isVisible()).toBeTruthy();
      }
    });
  });

  test('Navigation should work on all screen sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await test.step(`Test navigation on ${viewport.name}`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await dashboardPage.goto();
        
        // Test navigation to different pages
        const navLinks = [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Vehicles', url: '/vehicles' },
          { text: 'Fuel Entries', url: '/fuel-entries' },
          { text: 'Settings', url: '/settings' }
        ];
        
        for (const link of navLinks) {
          if (viewport.width < 768) {
            // On mobile, open hamburger menu first
            const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
            if (await hamburgerMenu.isVisible()) {
              await hamburgerMenu.click();
            }
          }
          
          const navLink = page.locator(`a:has-text("${link.text}")`);
          if (await navLink.isVisible()) {
            await navLink.click();
            await page.waitForURL(`**${link.url}`);
            expect(page.url()).toContain(link.url);
          }
        }
      });
    }
  });

  test('Touch interactions should work on mobile', async ({ page }) => {
    await test.step('Set mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    await test.step('Test touch interactions', async () => {
      await dashboardPage.goto();
      
      // Test touch on buttons
      const addVehicleButton = dashboardPage.addVehicleButton;
      if (await addVehicleButton.isVisible()) {
        await addVehicleButton.tap();
        await page.waitForSelector('[data-testid="vehicle-form"]');
        await page.goBack();
      }
      
      // Test touch on cards
      const vehicleCards = page.locator('[data-testid="vehicle-card"]');
      if (await vehicleCards.count() > 0) {
        await vehicleCards.first().tap();
        // Verify card interaction worked
      }
    });
  });
});


