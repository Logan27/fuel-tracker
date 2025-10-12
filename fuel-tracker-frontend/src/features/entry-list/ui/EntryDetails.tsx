import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { useUnitConversion } from '@/shared/lib/hooks/useUnitConversion';
import { 
  Calendar, 
  Gauge, 
  Fuel, 
  Coins, 
  MapPin, 
  Edit, 
  Trash2,
  X,
  FileText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import type { FuelEntry } from '@/entities/fuel-entry';

// Helper to ensure numeric values (Django may return strings for Decimal fields)
const toNumber = (value: number | string | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
};

interface EntryDetailsProps {
  entry: FuelEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (entry: FuelEntry) => void;
  onDelete?: (entry: FuelEntry) => void;
  vehicleName?: string;
}

export const EntryDetails = memo(({
  entry,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  vehicleName,
}: EntryDetailsProps) => {
  const { pricePrecision } = useUnitConversion();
  const entryDate = useMemo(() => entry ? new Date(entry.entry_date) : null, [entry]);
  const formattedDate = useMemo(() => entryDate ? format(entryDate, 'PPP') : '', [entryDate]);
  const formattedCreatedAt = useMemo(() => 
    entry ? format(new Date(entry.created_at), 'PPp') : '', 
    [entry]
  );

  if (!entry) return null;

  const handleEdit = () => {
    onEdit?.(entry);
    onClose();
  };

  const handleDelete = () => {
    onDelete?.(entry);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fuel Entry Details
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{formattedDate}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {entry.station_name}
                  </p>
                </div>
                {vehicleName && (
                  <Badge variant="outline">{vehicleName}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Brand & Grade:</span>
                <span className="font-medium">{entry.fuel_brand} • {entry.fuel_grade}</span>
              </div>
            </CardContent>
          </Card>

          {/* Main Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Odometer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {toNumber(entry.odometer).toLocaleString()} km
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Fuel Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {toNumber(entry.liters).toFixed(2)} L
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cost Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Cost Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-semibold">
                    {toNumber(entry.total_amount).toFixed(2)}
                  </p>
                </div>
                {entry.unit_price && (
                  <div>
                    <p className="text-sm text-muted-foreground">Unit Price</p>
                    <p className="text-xl font-semibold">
                      {toNumber(entry.unit_price).toFixed(pricePrecision)} per liter
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Computed Metrics */}
          {(entry.distance_since_last ||
            entry.consumption_l_100km ||
            entry.cost_per_km) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Computed Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {entry.distance_since_last !== undefined && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Distance Since Last</p>
                      <p className="text-lg font-semibold">
                        {toNumber(entry.distance_since_last).toFixed(0)} km
                      </p>
                    </div>
                  )}
                  {entry.consumption_l_100km !== undefined && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Consumption</p>
                      <p className="text-lg font-semibold">
                        {toNumber(entry.consumption_l_100km).toFixed(2)} L/100km
                      </p>
                    </div>
                  )}
                  {entry.cost_per_km !== undefined && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Cost per km</p>
                      <p className="text-lg font-semibold">
                        {toNumber(entry.cost_per_km).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {entry.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">
                <p>Created: {formattedCreatedAt}</p>
                <p>Entry ID: {entry.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            {onEdit && (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Entry
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Entry
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
