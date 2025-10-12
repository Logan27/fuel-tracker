// API mocking utilities for tests

import { vi } from 'vitest';
import { AxiosResponse } from 'axios';

// Mock data
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  date_joined: '2024-01-01T00:00:00Z',
};

export const mockVehicle = {
  id: 1,
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  user: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockFuelEntry = {
  id: 1,
  vehicle: 1,
  date: '2024-01-15',
  odometer: 10000,
  fuel_amount: 50.5,
  price_per_liter: 1.5,
  total_cost: 75.75,
  unit_price: 1.5,
  distance_since_last: null,
  consumption_l_100km: null,
  cost_per_km: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

export const mockStatistics = {
  total_vehicles: 1,
  total_fuel_entries: 5,
  total_distance: 1000,
  total_fuel_consumed: 100,
  average_consumption: 10,
  total_cost: 500,
  average_cost_per_km: 0.5,
};

// Mock responses
export const createMockResponse = <T>(data: T, status = 200): AxiosResponse<T> => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

// Auth API mocks
export const authApiMocks = {
  signUp: vi.fn().mockResolvedValue(createMockResponse(mockUser, 201)),
  signIn: vi.fn().mockResolvedValue(createMockResponse(mockUser, 200)),
  signOut: vi.fn().mockResolvedValue(createMockResponse({}, 200)),
  getCurrentUser: vi.fn().mockResolvedValue(createMockResponse(mockUser, 200)),
};

// Vehicle API mocks
export const vehicleApiMocks = {
  getVehicles: vi.fn().mockResolvedValue(createMockResponse([mockVehicle], 200)),
  getVehicle: vi.fn().mockResolvedValue(createMockResponse(mockVehicle, 200)),
  createVehicle: vi.fn().mockResolvedValue(createMockResponse(mockVehicle, 201)),
  updateVehicle: vi.fn().mockResolvedValue(createMockResponse(mockVehicle, 200)),
  deleteVehicle: vi.fn().mockResolvedValue(createMockResponse({}, 204)),
};

// Fuel Entry API mocks
export const fuelEntryApiMocks = {
  getFuelEntries: vi.fn().mockResolvedValue(createMockResponse([mockFuelEntry], 200)),
  getFuelEntry: vi.fn().mockResolvedValue(createMockResponse(mockFuelEntry, 200)),
  createFuelEntry: vi.fn().mockResolvedValue(createMockResponse(mockFuelEntry, 201)),
  updateFuelEntry: vi.fn().mockResolvedValue(createMockResponse(mockFuelEntry, 200)),
  deleteFuelEntry: vi.fn().mockResolvedValue(createMockResponse({}, 204)),
};

// Statistics API mocks
export const statisticsApiMocks = {
  getDashboardStats: vi.fn().mockResolvedValue(createMockResponse(mockStatistics, 200)),
  getConsumptionChart: vi.fn().mockResolvedValue(createMockResponse([], 200)),
  getCostChart: vi.fn().mockResolvedValue(createMockResponse([], 200)),
};

// User API mocks
export const userApiMocks = {
  updateProfile: vi.fn().mockResolvedValue(createMockResponse(mockUser, 200)),
  changePassword: vi.fn().mockResolvedValue(createMockResponse({}, 200)),
  exportData: vi.fn().mockResolvedValue(createMockResponse({}, 200)),
  deleteAccount: vi.fn().mockResolvedValue(createMockResponse({}, 204)),
};

// Error responses
export const createErrorResponse = (status: number, message: string) => {
  const error = new Error(message);
  (error as any).response = {
    status,
    data: { message },
  };
  return Promise.reject(error);
};

// Network error
export const createNetworkError = () => {
  const error = new Error('Network Error');
  (error as any).code = 'NETWORK_ERROR';
  return Promise.reject(error);
};

// Setup function to reset all mocks
export const resetAllMocks = () => {
  Object.values(authApiMocks).forEach(mock => mock.mockClear());
  Object.values(vehicleApiMocks).forEach(mock => mock.mockClear());
  Object.values(fuelEntryApiMocks).forEach(mock => mock.mockClear());
  Object.values(statisticsApiMocks).forEach(mock => mock.mockClear());
  Object.values(userApiMocks).forEach(mock => mock.mockClear());
};

// Setup function to mock API client
export const setupApiMocks = () => {
  // Mock the retryApiClient
  vi.mock('@/shared/api/retryClient', () => ({
    retryApiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  }));

  // Mock individual API modules
  vi.mock('@/features/auth/api/authApi', () => ({
    authApi: authApiMocks,
  }));

  vi.mock('@/entities/vehicle/api/vehicleApi', () => ({
    vehicleApi: vehicleApiMocks,
  }));

  vi.mock('@/entities/fuel-entry/api/fuelEntryApi', () => ({
    fuelEntryApi: fuelEntryApiMocks,
  }));

  vi.mock('@/entities/statistics/api/statisticsApi', () => ({
    statisticsApi: statisticsApiMocks,
  }));

  vi.mock('@/entities/user/api/userApi', () => ({
    userApi: userApiMocks,
  }));
};

// Helper to create paginated response
export const createPaginatedResponse = <T>(data: T[], page = 1, pageSize = 10) => ({
  data,
  pagination: {
    page,
    page_size: pageSize,
    total_pages: Math.ceil(data.length / pageSize),
    total_count: data.length,
    has_next: page < Math.ceil(data.length / pageSize),
    has_previous: page > 1,
  },
});

// Helper to create validation error response
export const createValidationErrorResponse = (errors: Record<string, string[]>) => {
  const error = new Error('Validation failed');
  (error as any).response = {
    status: 400,
    data: { errors },
  };
  return Promise.reject(error);
};
