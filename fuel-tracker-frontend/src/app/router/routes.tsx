import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from '@/shared/lib/constants';

// Lazy-loaded pages
const Index = lazy(() => import('@/pages/Index'));
const Auth = lazy(() => import('@/pages/Auth'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Entries = lazy(() => import('@/pages/Entries'));
const EntryForm = lazy(() => import('@/pages/EntryForm'));
const Vehicles = lazy(() => import('@/pages/Vehicles'));
const Settings = lazy(() => import('@/pages/Settings'));
const Statistics = lazy(() => import('@/pages/Statistics'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path={ROUTES.HOME} element={<Index />} />
      <Route path={ROUTES.AUTH} element={<Auth />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />

      {/* Protected routes */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ENTRIES}
        element={
          <ProtectedRoute>
            <Entries />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ENTRIES_NEW}
        element={
          <ProtectedRoute>
            <EntryForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entries/edit/:id"
        element={
          <ProtectedRoute>
            <EntryForm />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.VEHICLES}
        element={
          <ProtectedRoute>
            <Vehicles />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.SETTINGS}
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.STATISTICS}
        element={
          <ProtectedRoute>
            <Statistics />
          </ProtectedRoute>
        }
      />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

