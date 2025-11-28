import { VehicleCard } from './VehicleCard';
import { EmptyVehicles } from '@/shared/ui/empty-states';
import { VehicleCardSkeleton } from '@/shared/ui/skeleton-loaders';
import { useVehicleStore } from '@/app/stores';
import type { Vehicle } from '@/entities/vehicle';

interface VehicleListProps {
  vehicles: Vehicle[];
  isLoading?: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onAddVehicle?: () => void;
}

export const VehicleList = ({
  vehicles,
  isLoading = false,
  onEdit,
  onDelete,
  onAddVehicle,
}: VehicleListProps) => {
  const { selectedVehicleId, setSelectedVehicleId } = useVehicleStore();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <VehicleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (vehicles.length === 0) {
    return <EmptyVehicles onAddVehicle={onAddVehicle || (() => {})} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          isSelected={selectedVehicleId === vehicle.id}
          onSelect={() => setSelectedVehicleId(vehicle.id)}
          onEdit={() => onEdit(vehicle)}
          onDelete={() => onDelete(vehicle)}
        />
      ))}
    </div>
  );
};

