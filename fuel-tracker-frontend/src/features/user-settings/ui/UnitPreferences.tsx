import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { CURRENCIES, DISTANCE_UNIT_OPTIONS, VOLUME_UNIT_OPTIONS } from '@/shared/lib/constants';

interface UnitPreferencesProps {
  currency: string;
  distanceUnit: 'km' | 'mi';
  volumeUnit: 'L' | 'gal';
  onCurrencyChange: (value: string) => void;
  onDistanceUnitChange: (value: 'km' | 'mi') => void;
  onVolumeUnitChange: (value: 'L' | 'gal') => void;
  disabled?: boolean;
}

export const UnitPreferences = ({
  currency,
  distanceUnit,
  volumeUnit,
  onCurrencyChange,
  onDistanceUnitChange,
  onVolumeUnitChange,
  disabled = false,
}: UnitPreferencesProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currency">Preferred Currency</Label>
        <Select value={currency} onValueChange={onCurrencyChange} disabled={disabled}>
          <SelectTrigger id="currency">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((curr) => (
              <SelectItem key={curr.code} value={curr.code}>
                {curr.symbol} {curr.code} - {curr.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Currency used for displaying costs and expenses
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="distance-unit">Distance Unit</Label>
        <Select
          value={distanceUnit}
          onValueChange={(value) => onDistanceUnitChange(value as 'km' | 'mi')}
          disabled={disabled}
        >
          <SelectTrigger id="distance-unit">
            <SelectValue placeholder="Select distance unit" />
          </SelectTrigger>
          <SelectContent>
            {DISTANCE_UNIT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Unit for displaying distances and odometer readings
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="volume-unit">Volume Unit</Label>
        <Select
          value={volumeUnit}
          onValueChange={(value) => onVolumeUnitChange(value as 'L' | 'gal')}
          disabled={disabled}
        >
          <SelectTrigger id="volume-unit">
            <SelectValue placeholder="Select volume unit" />
          </SelectTrigger>
          <SelectContent>
            {VOLUME_UNIT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Unit for displaying fuel volume
        </p>
      </div>
    </div>
  );
};

