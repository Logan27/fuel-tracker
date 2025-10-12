import * as React from "react";
import { Car, Fuel, Plus, Search, Settings, TrendingUp } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn("border-dashed", className)} {...props}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          {icon && (
            <div className="mb-4 rounded-full bg-muted p-3">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {description}
          </p>
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);
EmptyState.displayName = "EmptyState";

// Predefined empty states for common scenarios
export const EmptyVehicles = ({ onAddVehicle }: { onAddVehicle: () => void }) => (
  <EmptyState
    icon={<Car className="h-8 w-8 text-muted-foreground" />}
    title="No vehicles yet"
    description="Add your first vehicle to start tracking fuel consumption and costs."
    action={{
      label: "Add Vehicle",
      onClick: onAddVehicle,
    }}
  />
);

export const EmptyFuelEntries = ({ onAddEntry }: { onAddEntry: () => void }) => (
  <EmptyState
    icon={<Fuel className="h-8 w-8 text-muted-foreground" />}
    title="No fuel entries yet"
    description="Add your first fuel entry to start tracking your vehicle's consumption."
    action={{
      label: "Add Entry",
      onClick: onAddEntry,
    }}
  />
);

export const EmptySearchResults = ({ searchTerm }: { searchTerm: string }) => (
  <EmptyState
    icon={<Search className="h-8 w-8 text-muted-foreground" />}
    title="No results found"
    description={`No entries found for "${searchTerm}". Try adjusting your search terms.`}
  />
);

export const EmptyStatistics = () => (
  <EmptyState
    icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
    title="No data to display"
    description="Add some fuel entries to see statistics and trends."
  />
);

export const EmptySettings = () => (
  <EmptyState
    icon={<Settings className="h-8 w-8 text-muted-foreground" />}
    title="Settings"
    description="Configure your preferences and account settings."
  />
);

// Generic empty state with custom content
export const CustomEmptyState = ({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) => (
  <EmptyState
    icon={icon}
    title={title}
    description={description}
    action={action}
    className={className}
  />
);

export { EmptyState };
