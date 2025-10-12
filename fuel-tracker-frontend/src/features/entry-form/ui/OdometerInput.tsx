import { useState, useEffect } from 'react';
import { Gauge } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { FormControl, FormDescription, FormMessage } from '@/shared/ui/form';
import { validateOdometerMonotonicity } from '../lib/odometerValidator';

interface OdometerInputProps {
  value: number;
  onChange: (value: number) => void;
  vehicleId?: number;
  excludeEntryId?: number;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export const OdometerInput = ({
  value,
  onChange,
  vehicleId,
  excludeEntryId,
  disabled = false,
  onValidationChange,
}: OdometerInputProps) => {
  const [validationError, setValidationError] = useState<string>('');
  const [lastOdometer, setLastOdometer] = useState<number | undefined>();
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const validateOdometer = async () => {
      if (!vehicleId || !value || value <= 0) {
        setValidationError('');
        setLastOdometer(undefined);
        onValidationChange?.(true);
        return;
      }

      setIsValidating(true);
      const result = await validateOdometerMonotonicity(
        vehicleId,
        value,
        excludeEntryId
      );
      setIsValidating(false);

      if (!result.isValid) {
        setValidationError(result.message || 'Invalid odometer value');
        setLastOdometer(result.lastOdometer);
        onValidationChange?.(false);
      } else {
        setValidationError('');
        setLastOdometer(result.lastOdometer);
        onValidationChange?.(true);
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(validateOdometer, 500);
    return () => clearTimeout(timeoutId);
  }, [value, vehicleId, excludeEntryId, onValidationChange]);

  return (
    <div className="space-y-2">
      <FormControl>
        <div className="relative">
          <Gauge className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            placeholder="e.g., 15000"
            disabled={disabled || isValidating}
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : 0)}
            className="pl-10"
            min={0}
            step={0.1}
          />
        </div>
      </FormControl>
      {lastOdometer !== undefined && !validationError && (
        <FormDescription>
          Last odometer reading: {lastOdometer.toLocaleString()} km
        </FormDescription>
      )}
      {validationError && (
        <FormMessage className="text-destructive">{validationError}</FormMessage>
      )}
      {isValidating && (
        <FormDescription className="text-muted-foreground text-xs">
          Validating...
        </FormDescription>
      )}
    </div>
  );
};

