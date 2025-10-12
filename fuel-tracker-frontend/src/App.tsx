import { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { AppRoutes } from '@/app/router';
import { ErrorBoundary, LoadingSpinner } from '@/shared/ui';

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProviders>
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" text="Loading application..." />
              </div>
            }
          >
            <AppRoutes />
          </Suspense>
        </AppProviders>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
