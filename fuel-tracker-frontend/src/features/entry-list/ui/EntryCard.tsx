import { memo, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useUnitConversion } from '@/shared/lib/hooks/useUnitConversion';
import { Calendar, Gauge, Fuel, Coins, MapPin, Edit, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import type { FuelEntry } from '@/entities/fuel-entry';

// Helper to ensure numeric values (Django may return strings for Decimal fields)
const toNumber = (value: number | string | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
};

interface EntryCardProps {
  entry: FuelEntry;
  onEdit?: (entry: FuelEntry) => void;
  onDelete?: (entry: FuelEntry) => void;
  onViewDetails?: (entry: FuelEntry) => void;
  showVehicleName?: boolean;
  vehicleName?: string;
}

export const EntryCard = memo(({
  entry,
  onEdit,
  onDelete,
  onViewDetails,
  showVehicleName = false,
  vehicleName,
}: EntryCardProps) => {
  const { pricePrecision } = useUnitConversion();
  const entryDate = useMemo(() => new Date(entry.entry_date), [entry.entry_date]);
  const formattedDate = useMemo(() => format(entryDate, 'PPP'), [entryDate]);
  const formattedCreatedAt = useMemo(() => format(new Date(entry.created_at), 'PPp'), [entry.created_at]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking edit
    onEdit?.(entry);
  }, [onEdit, entry]);

  const handleCardClick = useCallback(() => {
    onViewDetails?.(entry);
  }, [onViewDetails, entry]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking delete
    onDelete?.(entry);
  }, [onDelete, entry]);

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-0.5 text-sm">
              <MapPin className="h-3 w-3" />
              {entry.station_name}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                title="Edit entry"
                aria-label="Edit entry"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                title="Delete entry"
                aria-label="Delete entry"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {showVehicleName && vehicleName && (
          <div>
            <Badge variant="outline">{vehicleName}</Badge>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              Odometer
            </p>
            <p className="text-base font-semibold">
              {toNumber(entry.odometer).toLocaleString()} km
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Fuel className="h-3 w-3" />
              Fuel
            </p>
            <p className="text-base font-semibold">{toNumber(entry.liters).toFixed(2)} L</p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Brand & Grade</p>
            <p className="text-sm font-medium">
              {entry.fuel_brand} • {entry.fuel_grade}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Coins className="h-3 w-3" />
              Total Cost
            </p>
            <p className="text-base font-semibold">
              {toNumber(entry.total_amount).toFixed(2)}
            </p>
          </div>
        </div>

        {entry.unit_price && (
          <div className="rounded-lg bg-muted p-2">
            <p className="text-xs text-muted-foreground">Unit Price</p>
            <p className="text-sm font-medium">
              {toNumber(entry.unit_price).toFixed(pricePrecision)} per liter
            </p>
          </div>
        )}

        {/* Computed Metrics */}
        {(entry.distance_since_last ||
          entry.consumption_l_100km ||
          entry.cost_per_km) && (
          <>
            <Separator />
            <div className="grid grid-cols-3 gap-2 text-center">
              {entry.distance_since_last !== undefined && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="text-sm font-semibold">
                    {toNumber(entry.distance_since_last).toFixed(0)} km
                  </p>
                </div>
              )}
              {entry.consumption_l_100km !== undefined && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Consumption</p>
                  <p className="text-sm font-semibold">
                    {toNumber(entry.consumption_l_100km).toFixed(2)} L/100km
                  </p>
                </div>
              )}
              {entry.cost_per_km !== undefined && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Cost/km</p>
                  <p className="text-sm font-semibold">
                    {toNumber(entry.cost_per_km).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {entry.notes && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm">{entry.notes}</p>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground pt-2">
        Added {formattedCreatedAt}
      </CardFooter>
    </Card>
  );
});

