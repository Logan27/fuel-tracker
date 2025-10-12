import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { UnitPreferences } from './UnitPreferences';
import { useUserSettings } from '../lib/useUserSettings';
import { useUserSettingsStore } from '@/app/stores';
import { useAuthStore } from '@/app/stores';
import { useState } from 'react';

export const SettingsForm = () => {
  const { updateSettings, isUpdating } = useUserSettings();
  const { user } = useAuthStore();
  const { 
    preferred_currency, 
    preferred_distance_unit, 
    preferred_volume_unit,
    price_precision,
    setCurrency,
    setDistanceUnit,
    setVolumeUnit,
    setPricePrecision
  } = useUserSettingsStore();
  
  const [displayName, setDisplayName] = useState(user?.display_name || '');

  const handleCurrencyChange = (currency: string) => {
    setCurrency(currency);
    // Немедленно сохраняем изменения на сервер
    updateSettings({ preferred_currency: currency });
  };

  const handleDistanceUnitChange = (unit: 'km' | 'mi') => {
    setDistanceUnit(unit);
    // Немедленно сохраняем изменения на сервер
    updateSettings({ preferred_distance_unit: unit });
  };

  const handleVolumeUnitChange = (unit: 'L' | 'gal') => {
    setVolumeUnit(unit);
    // Немедленно сохраняем изменения на сервер
    updateSettings({ preferred_volume_unit: unit });
  };
  
  const handleDisplayNameBlur = () => {
    if (displayName !== user?.display_name) {
      updateSettings({ display_name: displayName });
    }
  };
  
  const handlePricePrecisionChange = (value: string) => {
    const precision = parseInt(value, 10);
    setPricePrecision(precision);
    updateSettings({ price_precision: precision });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update your display name and personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              type="text"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={handleDisplayNameBlur}
              disabled={isUpdating}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              This name will be displayed throughout the application
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price_precision">Price Display Precision</Label>
            <Select 
              value={price_precision.toString()} 
              onValueChange={handlePricePrecisionChange}
              disabled={isUpdating}
            >
              <SelectTrigger id="price_precision">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 decimals (e.g., 1.42)</SelectItem>
                <SelectItem value="3">3 decimals (e.g., 1.425)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Number of decimal places to display for fuel prices
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Unit Preferences</CardTitle>
          <CardDescription>
            Choose your preferred units for displaying data. All stored data remains in metric.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <UnitPreferences
            currency={preferred_currency}
            distanceUnit={preferred_distance_unit}
            volumeUnit={preferred_volume_unit}
            onCurrencyChange={handleCurrencyChange}
            onDistanceUnitChange={handleDistanceUnitChange}
            onVolumeUnitChange={handleVolumeUnitChange}
            disabled={isUpdating}
          />

          {isUpdating && (
            <div className="flex justify-center">
              <p className="text-sm text-muted-foreground">Saving changes...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

