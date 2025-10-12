import { useState } from 'react';
import { X, Search, Calendar, Filter } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { DatePickerWithRange } from '@/shared/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Badge } from '@/shared/ui/badge';
import type { Vehicle } from '@/entities/vehicle';
import type { FuelEntryFilters } from '@/entities/fuel-entry';
import { COMMON_FUEL_BRANDS, COMMON_FUEL_GRADES } from '@/features/entry-form/lib/entrySchemas';

interface EntryFiltersProps {
  vehicles: Vehicle[];
  filters: FuelEntryFilters;
  onFilterChange: (filters: FuelEntryFilters) => void;
  onClearFilters: () => void;
}

export const EntryFilters = ({
  vehicles,
  filters,
  onFilterChange,
  onClearFilters,
}: EntryFiltersProps) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined && value !== '');

  // Get sort order options based on selected sort by field
  const getSortOrderOptions = (sortBy: string) => {
    switch (sortBy) {
      case 'entry_date':
        return [
          { value: 'desc', label: 'Newest First' },
          { value: 'asc', label: 'Oldest First' }
        ];
      case 'odometer':
        return [
          { value: 'desc', label: 'Highest First' },
          { value: 'asc', label: 'Lowest First' }
        ];
      case 'total_amount':
        return [
          { value: 'desc', label: 'Highest First' },
          { value: 'asc', label: 'Lowest First' }
        ];
      case 'created_at':
        return [
          { value: 'desc', label: 'Newest First' },
          { value: 'asc', label: 'Oldest First' }
        ];
      default:
        return [
          { value: 'desc', label: 'Newest First' },
          { value: 'asc', label: 'Oldest First' }
        ];
    }
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    onFilterChange({
      ...filters,
      date_after: range?.from?.toISOString().split('T')[0],
      date_before: range?.to?.toISOString().split('T')[0],
    });
  };

  const getDateRange = () => {
    if (filters.date_after && filters.date_before) {
      return {
        from: new Date(filters.date_after),
        to: new Date(filters.date_before),
      };
    }
    if (filters.date_after) {
      return { from: new Date(filters.date_after) };
    }
    if (filters.date_before) {
      return { to: new Date(filters.date_before) };
    }
    return undefined;
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== ''
  ).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters} className="h-8">
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* First row - Vehicle, Date Range, Fuel Brand, Fuel Grade */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Vehicle</label>
            <Select
              value={filters.vehicle?.toString() || 'all'}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  vehicle: value === 'all' ? undefined : parseInt(value),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All vehicles</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                    {vehicle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date Range</label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setIsDatePickerOpen(true)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.date_after && filters.date_before
                    ? `${filters.date_after} - ${filters.date_before}`
                    : filters.date_after
                    ? `From ${filters.date_after}`
                    : filters.date_before
                    ? `Until ${filters.date_before}`
                    : 'Select date range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DatePickerWithRange
                  value={getDateRange()}
                  onChange={(range) => {
                    handleDateRangeChange(range);
                    // Close picker after selection
                    if (range?.from && range?.to) {
                      setIsDatePickerOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Fuel Brand</label>
            <Select
              value={filters.fuel_brand || 'all'}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  fuel_brand: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brands</SelectItem>
                {COMMON_FUEL_BRANDS.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Fuel Grade</label>
            <Select
              value={filters.fuel_grade || 'all'}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  fuel_grade: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All grades</SelectItem>
                {COMMON_FUEL_GRADES.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Second row - Station Search, Sort By, Sort Order */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Station Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search stations..."
                value={filters.station_name || ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    station_name: e.target.value || undefined,
                  })
                }
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Sort By</label>
            <Select
              value={filters.sort_by || 'entry_date'}
              onValueChange={(value: 'entry_date' | 'odometer' | 'total_amount' | 'created_at') =>
                onFilterChange({
                  ...filters,
                  sort_by: value,
                  sort_order: 'desc', // Reset to default when changing sort field
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry_date">Entry Date</SelectItem>
                <SelectItem value="odometer">Odometer</SelectItem>
                <SelectItem value="total_amount">Total Amount</SelectItem>
                <SelectItem value="created_at">Created Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Sort Order</label>
            <Select
              value={filters.sort_order || 'desc'}
              onValueChange={(value: 'asc' | 'desc') =>
                onFilterChange({
                  ...filters,
                  sort_order: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getSortOrderOptions(filters.sort_by || 'entry_date').map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

