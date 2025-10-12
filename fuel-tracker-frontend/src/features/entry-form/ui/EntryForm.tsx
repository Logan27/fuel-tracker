import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Fuel, Coins, FileText } from 'lucide-react';
import {
  entrySchema,
  defaultEntryValues,
  COMMON_FUEL_BRANDS,
  COMMON_FUEL_GRADES,
  type EntryFormData,
} from '../lib/entrySchemas';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { LoadingButton } from '@/shared/ui/loading-button';
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
import type { FuelEntry } from '@/entities/fuel-entry';
import type { Vehicle } from '@/entities/vehicle';
import { DatePicker } from './DatePicker';
import { OdometerInput } from './OdometerInput';
import {
  calculateUnitPrice,
  calculateConsumption,
  calculateCostPerKm,
} from '../lib/odometerValidator';

interface EntryFormProps {
  entry?: FuelEntry;
  vehicles: Vehicle[];
  selectedVehicleId?: number;
  onSubmit: (data: EntryFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const EntryForm = ({
  entry,
  vehicles,
  selectedVehicleId,
  onSubmit,
  onCancel,
  isLoading = false,
}: EntryFormProps) => {
  const form = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: entry
      ? {
          vehicle_id: entry.vehicle_id,
          entry_date: entry.entry_date.split('T')[0],
          odometer: entry.odometer,
          station_name: entry.station_name,
          fuel_brand: entry.fuel_brand,
          fuel_grade: entry.fuel_grade,
          liters: entry.liters,
          total_amount: entry.total_amount,
          notes: entry.notes || '',
        }
      : {
          ...defaultEntryValues,
          vehicle_id: selectedVehicleId || vehicles[0]?.id || 0,
        },
  });

  const watchedValues = form.watch();
  const unitPrice = calculateUnitPrice(
    watchedValues.total_amount || 0,
    watchedValues.liters || 0
  );

  const handleSubmit = (data: EntryFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Vehicle Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle</CardTitle>
            <CardDescription>Select the vehicle for this fuel entry</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      if (!entry) {
                        const vehicleId = parseInt(value);
                        field.onChange(isNaN(vehicleId) ? 0 : vehicleId);
                      }
                    }}
                    value={field.value?.toString()}
                    disabled={isLoading || !!entry}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {vehicle.name}
                          {vehicle.make && ` - ${vehicle.make}`}
                          {vehicle.model && ` ${vehicle.model}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {entry
                      ? 'Vehicle cannot be changed for existing entries'
                      : 'Choose which vehicle you refueled'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Date and Odometer */}
        <Card>
          <CardHeader>
            <CardTitle>Date & Odometer</CardTitle>
            <CardDescription>When and where on the odometer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="entry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Date *</FormLabel>
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) =>
                      field.onChange(date?.toISOString().split('T')[0])
                    }
                    disabled={isLoading}
                    placeholder="Select entry date"
                  />
                  <FormDescription>
                    The date when you refueled (cannot be in the future)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="odometer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odometer Reading (km) *</FormLabel>
                  <OdometerInput
                    value={field.value || 0}
                    onChange={field.onChange}
                    vehicleId={watchedValues.vehicle_id}
                    excludeEntryId={entry?.id}
                    disabled={isLoading}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Station and Fuel Details */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Details</CardTitle>
            <CardDescription>Station, brand, and fuel grade information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="station_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Station Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g., Shell Station #123"
                        disabled={isLoading}
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>The name or location of the gas station</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fuel_brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Brand *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMMON_FUEL_BRANDS.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuel_grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Grade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMMON_FUEL_GRADES.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Fuel Amount */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Amount & Cost</CardTitle>
            <CardDescription>How much fuel and how much it cost</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="liters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liters *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Fuel className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="e.g., 45.5"
                          disabled={isLoading}
                          className="pl-10"
                          step="0.01"
                          min={0}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value || '');
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Amount of fuel in liters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Coins className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="e.g., 50.00"
                          disabled={isLoading}
                          className="pl-10"
                          step="0.01"
                          min={0}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value || '');
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Total cost in your currency</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {unitPrice > 0 && (
              <>
                <Separator />
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium">Calculated Unit Price</p>
                  <p className="text-2xl font-bold">{unitPrice.toFixed(2)} per liter</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes (Optional)</CardTitle>
            <CardDescription>Any additional information about this refueling</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        placeholder="e.g., Highway driving, full tank, etc."
                        disabled={isLoading}
                        className="pl-10 min-h-[100px]"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Add any notes about driving conditions, route, etc. (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-2 justify-end pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <LoadingButton 
            type="submit" 
            isLoading={isLoading}
            loadingText={entry ? 'Updating...' : 'Creating...'}
          >
            {entry ? 'Update Entry' : 'Create Entry'}
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
};

