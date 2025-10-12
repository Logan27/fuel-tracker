export interface FuelEntry {
  id: number;
  vehicle_id: number;
  user_id: string;
  entry_date: string; // ISO date string
  odometer: number;
  station_name: string;
  fuel_brand: string;
  fuel_grade: string;
  liters: number;
  total_amount: number;
  notes?: string;
  
  // Computed fields
  unit_price?: number;
  distance_since_last?: number;
  consumption_l_100km?: number;
  cost_per_km?: number;
  
  created_at: string;
  updated_at: string;
}

export interface CreateFuelEntryDto {
  vehicle: number;
  entry_date: string;
  odometer: number;
  station_name: string;
  fuel_brand: string;
  fuel_grade: string;
  liters: number;
  total_amount: number;
  notes?: string;
}

export interface UpdateFuelEntryDto {
  entry_date?: string;
  odometer?: number;
  station_name?: string;
  fuel_brand?: string;
  fuel_grade?: string;
  liters?: number;
  total_amount?: number;
  notes?: string;
}

export interface FuelEntryFilters {
  vehicle?: number;
  date_after?: string;
  date_before?: string;
  fuel_brand?: string;
  fuel_grade?: string;
  station_name?: string;
  sort_by?: 'entry_date' | 'odometer' | 'total_amount' | 'created_at';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

export interface PaginatedFuelEntries {
  next: string | null;
  previous: string | null;
  results: FuelEntry[];
}
