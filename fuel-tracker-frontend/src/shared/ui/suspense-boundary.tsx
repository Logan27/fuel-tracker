import * as React from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "./error-boundary";
import { Skeleton } from "./skeleton";
import { Card, CardContent } from "./card";

interface SuspenseBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: (error: Error, resetError: () => void) => React.ReactNode;
  className?: string;
}

// Default loading fallback
const DefaultLoadingFallback = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </CardContent>
  </Card>
);

// Default error fallback
const DefaultErrorFallback = (error: Error, resetError: () => void) => (
  <Card className="border-destructive">
    <CardContent className="p-6 text-center">
      <h3 className="text-lg font-semibold text-destructive mb-2">
        Something went wrong
      </h3>
      <p className="text-muted-foreground mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Try again
      </button>
    </CardContent>
  </Card>
);

export const SuspenseBoundary = ({
  children,
  fallback = <DefaultLoadingFallback />,
  errorFallback = DefaultErrorFallback,
  className,
}: SuspenseBoundaryProps) => {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <div className={className}>
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

// Specialized boundaries for different use cases
export const PageSuspenseBoundary = ({ children }: { children: React.ReactNode }) => (
  <SuspenseBoundary
    fallback={
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }
  >
    {children}
  </SuspenseBoundary>
);

export const ListSuspenseBoundary = ({ children }: { children: React.ReactNode }) => (
  <SuspenseBoundary
    fallback={
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    }
  >
    {children}
  </SuspenseBoundary>
);

export const ChartSuspenseBoundary = ({ children }: { children: React.ReactNode }) => (
  <SuspenseBoundary
    fallback={
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    }
  >
    {children}
  </SuspenseBoundary>
);
