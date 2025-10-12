import { Car, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

interface EmptyVehiclesProps {
  onAddClick: () => void;
}

export const EmptyVehicles = ({ onAddClick }: EmptyVehiclesProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Car className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No vehicles yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Add your first vehicle to start tracking fuel consumption and costs.
        </p>
        <Button onClick={onAddClick} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Your First Vehicle
        </Button>
      </CardContent>
    </Card>
  );
};

