import { Car, Check } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import { cn } from '@/shared/lib/utils';
import { useVehicleStore } from '@/app/stores';
import { useVehicles } from '@/features/vehicle-list';
import { useState } from 'react';

interface VehicleSelectorProps {
  className?: string;
}

export const VehicleSelector = ({ className }: VehicleSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { selectedVehicleId, setSelectedVehicleId } = useVehicleStore();
  const { vehicles, isLoading } = useVehicles();
  const selectedVehicle = vehicles?.find(v => v.id === selectedVehicleId);

  if (isLoading) {
    return (
      <Button variant="outline" disabled className={className}>
        <Car className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <Button variant="outline" disabled className={className}>
        <Car className="w-4 h-4 mr-2" />
        No vehicles
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', className)}
        >
          <Car className="w-4 h-4 mr-2" />
          {selectedVehicle ? selectedVehicle.name : 'All Vehicles'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search vehicle..." />
          <CommandList>
            <CommandEmpty>No vehicle found.</CommandEmpty>
            <CommandGroup>
              {/* All Vehicles Option */}
              <CommandItem
                value="all-vehicles"
                onSelect={() => {
                  setSelectedVehicleId(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedVehicleId === null ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="font-medium">All Vehicles</span>
              </CommandItem>
              
              {/* Individual Vehicles */}
              {vehicles
                .filter((v) => v.is_active)
                .map((vehicle) => (
                  <CommandItem
                    key={vehicle.id}
                    value={vehicle.name}
                    onSelect={() => {
                      setSelectedVehicleId(vehicle.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedVehicleId === vehicle.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{vehicle.name}</span>
                      {vehicle.make && vehicle.model && (
                        <span className="text-xs text-muted-foreground">
                          {vehicle.make} {vehicle.model}
                          {vehicle.year && ` (${vehicle.year})`}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

