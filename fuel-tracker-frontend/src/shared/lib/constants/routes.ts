/**
 * Константы маршрутов приложения
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
 * Публичные маршруты (не требуют аутентификации)
 */
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.AUTH,
  ROUTES.TERMS,
  ROUTES.PRIVACY,
] as const;

/**
 * Защищённые маршруты (требуют аутентификации)
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
 * Дефолтный маршрут после логина
 */
export const DEFAULT_PROTECTED_ROUTE = ROUTES.DASHBOARD;

/**
 * Дефолтный маршрут для неавторизованных пользователей
 */
export const DEFAULT_PUBLIC_ROUTE = ROUTES.AUTH;
