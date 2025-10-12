export interface User {
  id: string;
  email: string;
  display_name?: string;
  preferred_currency: string;
  preferred_distance_unit: 'km' | 'mi';
  preferred_volume_unit: 'L' | 'gal';
  timezone: string;
  price_precision: number;
}

export interface UserSettings {
  display_name?: string;
  preferred_currency: string;
  preferred_distance_unit: 'km' | 'mi';
  preferred_volume_unit: 'L' | 'gal';
  timezone: string;
  price_precision: number;
}

export interface UpdateUserSettingsDto {
  display_name?: string;
  preferred_currency?: string;
  preferred_distance_unit?: 'km' | 'mi';
  preferred_volume_unit?: 'L' | 'gal';
  timezone?: string;
  price_precision?: number;
}
