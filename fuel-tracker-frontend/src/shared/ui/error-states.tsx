import * as React from "react";
import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'network' | 'server';
}

const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  ({ title, description, action, className, variant = 'default', ...props }, ref) => {
    const getIcon = () => {
      switch (variant) {
        case 'network':
          return <WifiOff className="h-8 w-8 text-destructive" />;
        case 'server':
          return <AlertCircle className="h-8 w-8 text-destructive" />;
        default:
          return <AlertCircle className="h-8 w-8 text-destructive" />;
      }
    };

    return (
      <Card ref={ref} className={cn("border-destructive/20", className)} {...props}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-3">
            {getIcon()}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {description}
          </p>
          {action && (
            <Button variant="outline" onClick={action.onClick}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);
ErrorState.displayName = "ErrorState";

// Network error state
export const NetworkErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <ErrorState
    variant="network"
    title="Connection Error"
    description="Unable to connect to the server. Please check your internet connection and try again."
    action={{
      label: "Retry",
      onClick: onRetry,
    }}
  />
);

// Server error state
export const ServerErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <ErrorState
    variant="server"
    title="Server Error"
    description="Something went wrong on our end. Please try again in a few moments."
    action={{
      label: "Retry",
      onClick: onRetry,
    }}
  />
);

// Generic error state
export const GenericErrorState = ({ 
  title, 
  description, 
  onRetry 
}: { 
  title: string; 
  description: string; 
  onRetry: () => void; 
}) => (
  <ErrorState
    title={title}
    description={description}
    action={{
      label: "Retry",
      onClick: onRetry,
    }}
  />
);

// Error alert for inline errors
export const ErrorAlert = ({ 
  title, 
  description, 
  onDismiss 
}: { 
  title: string; 
  description: string; 
  onDismiss?: () => void; 
}) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>
      {description}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-2"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      )}
    </AlertDescription>
  </Alert>
);

// Connection status indicator
export const ConnectionStatus = ({ 
  isOnline, 
  isConnected 
}: { 
  isOnline: boolean; 
  isConnected: boolean; 
}) => {
  if (!isOnline) {
    return (
      <div className="flex items-center space-x-2 text-destructive">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm">Offline</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-yellow-600">
        <Wifi className="h-4 w-4" />
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-green-600">
      <Wifi className="h-4 w-4" />
      <span className="text-sm">Connected</span>
    </div>
  );
};

export { ErrorState };
