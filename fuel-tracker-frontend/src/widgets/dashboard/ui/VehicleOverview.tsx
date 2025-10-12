import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Car, Plus, Fuel, Gauge } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '@/features/vehicle-list';
import { cn } from '@/shared/lib/utils';

interface VehicleOverviewProps {
  className?: string;
}

export const VehicleOverview = ({ className }: VehicleOverviewProps) => {
  const navigate = useNavigate();
  const { vehicles, isLoading } = useVehicles();

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">My Vehicles</h2>
          <Button
            onClick={() => navigate('/vehicles/new')}
            className="gradient-hero"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
        
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Vehicles Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add your first vehicle to start tracking fuel consumption and expenses.
            </p>
            <Button
              onClick={() => navigate('/vehicles/new')}
              className="gradient-hero"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Vehicle
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Vehicles</h2>
        <Button
          onClick={() => navigate('/vehicles/new')}
          variant="outline"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <Card 
            key={vehicle.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                  <CardDescription>
                    {vehicle.make && vehicle.model && (
                      <>
                        {vehicle.make} {vehicle.model}
                        {vehicle.year && ` (${vehicle.year})`}
                      </>
                    )}
                    {vehicle.fuel_type && (
                      <span className="ml-2 text-xs bg-secondary px-2 py-1 rounded">
                        {vehicle.fuel_type}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Fuel className="w-4 h-4" />
                    <span>Fuel Type</span>
                  </div>
                  <span className="font-medium">
                    {vehicle.fuel_type || 'Not specified'}
                  </span>
                </div>
                
                {vehicle.year && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Gauge className="w-4 h-4" />
                      <span>Year</span>
                    </div>
                    <span className="font-medium">{vehicle.year}</span>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quick Stats</span>
                    <span className="text-xs text-muted-foreground">
                      Click to view details
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
