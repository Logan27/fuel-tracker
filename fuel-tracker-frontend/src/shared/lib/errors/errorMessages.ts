export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  
  // Authentication errors
  AUTH_UNAUTHORIZED: 'You need to sign in to access this page.',
  AUTH_FORBIDDEN: 'You do not have permission to access this resource.',
  AUTH_session_EXPIRED: 'Your session has expired. Please sign in again.',
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password.',
  
  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_email: 'Please enter a valid email address.',
  INVALID_DATE: 'Please enter a valid date.',
  
  // Resource errors
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_EXISTS: 'This resource already exists.',
  
  // Server errors
  SERVER_ERROR: 'An unexpected server error occurred. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
  
  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  
  // Success messages
  SUCCESS_CREATED: 'Created successfully!',
  SUCCESS_UPDATED: 'Updated successfully!',
  SUCCESS_DELETED: 'Deleted successfully!',
  
  // Vehicle messages
  VEHICLE_CREATED: 'Vehicle added successfully!',
  VEHICLE_UPDATED: 'Vehicle updated successfully!',
  VEHICLE_DELETED: 'Vehicle deleted successfully!',
  
  // Entry messages
  ENTRY_CREATED: 'Fuel entry added successfully!',
  ENTRY_UPDATED: 'Fuel entry updated successfully!',
  ENTRY_DELETED: 'Fuel entry deleted successfully!',
  
  // Settings messages
  SETTINGS_UPDATED: 'Settings updated successfully!',
  
  // Account messages
  ACCOUNT_DELETED: 'Account deleted successfully.',
  DATA_EXPORTED: 'Your data has been exported successfully!',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

export const getErrorMessage = (key: ErrorMessageKey): string => {
  return ERROR_MESSAGES[key];
};

