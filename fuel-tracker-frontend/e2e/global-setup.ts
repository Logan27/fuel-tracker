import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');
  
  // Start browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check if the application is running
    const isAppReady = await page.locator('body').isVisible();
    if (!isAppReady) {
      throw new Error('Application is not ready');
    }
    
    console.log('✅ Application is ready for testing');
    
    // Optional: Set up test data or perform other setup tasks
    // For example, create test users, seed database, etc.
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed');
}

export default globalSetup;


