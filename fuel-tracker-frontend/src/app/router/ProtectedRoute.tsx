import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/stores';
import { ROUTES } from '@/shared/lib/constants';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * HOC для защищённых маршрутов
 * Перенаправляет неавторизованных пользователей на страницу аутентификации
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Показываем loader пока проверяем сессию
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // Если не аутентифицирован, редиректим на /auth с сохранением текущего пути
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

