// Test data for E2E tests

export const testUsers = {
  valid: {
    email: 'test@example.com',
    password: 'password123',
  },
  newUser: {
    email: 'newuser@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  },
  invalid: {
    email: 'invalid-email',
    password: '123',
  },
};

export const testVehicles = {
  toyota: {
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
  },
  honda: {
    make: 'Honda',
    model: 'Civic',
    year: 2019,
  },
  bmw: {
    make: 'BMW',
    model: 'X5',
    year: 2021,
  },
  invalid: {
    make: '',
    model: '',
    year: 1800,
  },
};

export const testFuelEntries = {
  valid: {
    date: '2024-01-15',
    odometer: 10000,
    fuelAmount: 50.5,
    pricePerLiter: 1.5,
  },
  secondEntry: {
    date: '2024-01-20',
    odometer: 10200,
    fuelAmount: 45.0,
    pricePerLiter: 1.6,
  },
  invalid: {
    date: '2025-01-01', // Future date
    odometer: 5000, // Lower than previous
    fuelAmount: -10, // Negative
    pricePerLiter: 0, // Zero
  },
};

export const testDates = {
  today: new Date().toISOString().split('T')[0],
  yesterday: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  lastWeek: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  lastMonth: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

export const testUrls = {
  auth: '/auth',
  dashboard: '/dashboard',
  vehicles: '/vehicles',
  fuelEntries: '/fuel-entries',
  settings: '/settings',
};

export const testSelectors = {
  loadingSpinner: '[data-testid="loading-spinner"]',
  errorMessage: '[data-testid="error-message"]',
  successMessage: '[data-testid="success-message"]',
  vehicleCard: '[data-testid="vehicle-card"]',
  fuelEntryCard: '[data-testid="fuel-entry-card"]',
  statisticsCard: '[data-testid="stat-card"]',
  userMenu: '[data-testid="user-menu"]',
  emptyState: '[data-testid="empty-state"]',
};


