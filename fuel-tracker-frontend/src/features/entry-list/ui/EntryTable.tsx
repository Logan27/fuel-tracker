import { memo, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar, Gauge, Fuel, Coins, MapPin, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { useUnitConversion } from '@/shared/lib/hooks/useUnitConversion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import type { FuelEntry } from '@/entities/fuel-entry';

// Helper to ensure numeric values (Django may return strings for Decimal fields)
const toNumber = (value: number | string | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
};

interface EntryTableProps {
  entries: FuelEntry[];
  vehicles: { id: number; name: string }[];
  onEdit?: (entry: FuelEntry) => void;
  onDelete?: (entry: FuelEntry) => void;
  onViewDetails?: (entry: FuelEntry) => void;
  showVehicleName?: boolean;
}

export const EntryTable = memo(({
  entries,
  vehicles,
  onEdit,
  onDelete,
  onViewDetails,
  showVehicleName = false,
}: EntryTableProps) => {
  const { formatPrice, pricePrecision } = useUnitConversion();
  
  // Helper to get vehicle name by ID
  const getVehicleName = useCallback((vehicleId: number): string => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle?.name || 'Unknown Vehicle';
  }, [vehicles]);

  const handleEdit = useCallback((entry: FuelEntry) => {
    onEdit?.(entry);
  }, [onEdit]);

  const handleDelete = useCallback((entry: FuelEntry) => {
    onDelete?.(entry);
  }, [onDelete]);

  const handleViewDetails = useCallback((entry: FuelEntry) => {
    onViewDetails?.(entry);
  }, [onViewDetails]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead className="w-[200px]">Station</TableHead>
            {showVehicleName && <TableHead className="w-[150px]">Vehicle</TableHead>}
            <TableHead className="w-[100px] text-right">Odometer</TableHead>
            <TableHead className="w-[80px] text-right">Fuel (L)</TableHead>
            <TableHead className="w-[120px]">Brand & Grade</TableHead>
            <TableHead className="w-[100px] text-right">Total Cost</TableHead>
            <TableHead className="w-[80px] text-right">Unit Price</TableHead>
            <TableHead className="w-[120px]">Metrics</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const entryDate = new Date(entry.entry_date);
            const formattedDate = format(entryDate, 'MMM dd, yyyy');
            
            return (
              <TableRow key={entry.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formattedDate}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate max-w-[180px]" title={entry.station_name}>
                      {entry.station_name}
                    </span>
                  </div>
                </TableCell>

                {showVehicleName && (
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getVehicleName(entry.vehicle_id)}
                    </Badge>
                  </TableCell>
                )}

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Gauge className="h-3 w-3 text-muted-foreground" />
                    {toNumber(entry.odometer).toLocaleString()}
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Fuel className="h-3 w-3 text-muted-foreground" />
                    {toNumber(entry.liters).toFixed(2)}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{entry.fuel_brand}</div>
                    <div className="text-muted-foreground text-xs">{entry.fuel_grade}</div>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Coins className="h-3 w-3 text-muted-foreground" />
                    {toNumber(entry.total_amount).toFixed(2)}
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  {entry.unit_price ? (
                    <span className="text-sm">
                      {toNumber(entry.unit_price).toFixed(pricePrecision)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>

                <TableCell>
                  {(entry.distance_since_last ||
                    entry.consumption_l_100km ||
                    entry.cost_per_km) && (
                    <div className="text-xs space-y-1">
                      {entry.distance_since_last !== undefined && (
                        <div className="text-muted-foreground">
                          {toNumber(entry.distance_since_last).toFixed(0)} km
                        </div>
                      )}
                      {entry.consumption_l_100km !== undefined && (
                        <div className="text-muted-foreground">
                          {toNumber(entry.consumption_l_100km).toFixed(2)} L/100km
                        </div>
                      )}
                      {entry.cost_per_km !== undefined && (
                        <div className="text-muted-foreground">
                          {toNumber(entry.cost_per_km).toFixed(2)}/km
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onViewDetails && (
                        <DropdownMenuItem onClick={() => handleViewDetails(entry)}>
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => handleEdit(entry)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => handleDelete(entry)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

EntryTable.displayName = 'EntryTable';
