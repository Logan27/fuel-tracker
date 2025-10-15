/**
 * Application route constants
 */

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  ENTRIES: '/entries',
  ENTRIES_NEW: '/entries/new',
  ENTRIES_EDIT: (id: number | string) => `/entries/edit/${id}`,
  VEHICLES: '/vehicles',
  STATISTICS: '/statistics',
  SETTINGS: '/settings',
  TERMS: '/terms',
  PRIVACY: '/privacy',
} as const;

/**
 * Public routes (no authentication required)
 */
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.AUTH,
  ROUTES.TERMS,
  ROUTES.PRIVACY,
] as const;

/**
 * Protected routes (require authentication)
 */
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.ENTRIES,
  ROUTES.ENTRIES_NEW,
  ROUTES.VEHICLES,
  ROUTES.STATISTICS,
  ROUTES.SETTINGS,
] as const;

/**
 * Default route after login
 */
export const DEFAULT_PROTECTED_ROUTE = ROUTES.DASHBOARD;

/**
 * Default route for unauthenticated users
 */
export const DEFAULT_PUBLIC_ROUTE = ROUTES.AUTH;
