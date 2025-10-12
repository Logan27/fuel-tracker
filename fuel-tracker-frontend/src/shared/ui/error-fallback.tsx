import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
}

export const ErrorFallback = ({ error, resetError }: ErrorFallbackProps) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
          <CardDescription className="text-base mt-2">
            We're sorry, but an unexpected error occurred. Please try refreshing the
            page or go back to the home page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="p-4 bg-secondary rounded-lg">
              <summary className="cursor-pointer font-medium text-sm mb-2">
                Error Details (Development Only)
              </summary>
              <div className="mt-2">
                <p className="text-sm font-mono text-destructive break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40 p-2 bg-background rounded">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {resetError && (
              <Button onClick={resetError} className="flex-1" variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button
              onClick={handleReload}
              className="flex-1"
              variant={resetError ? 'outline' : 'default'}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
            <Button onClick={handleGoHome} className="flex-1" variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

