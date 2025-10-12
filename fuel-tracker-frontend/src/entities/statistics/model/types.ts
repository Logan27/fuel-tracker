export interface Period {
  type: '30d' | '90d' | 'ytd' | 'custom';
  date_after: string;
  date_before: string;
}

export interface Aggregates {
  average_consumption?: number;
  average_unit_price?: number;
  total_spent?: number;
  total_liters?: number;
  total_distance?: number;
  fill_up_count?: number;
  average_cost_per_km?: number;
  average_distance_per_day?: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface TimeSeries {
  consumption?: TimeSeriesPoint[];
  unit_price?: TimeSeriesPoint[];
}

export interface DashboardStats {
  period: Period;
  aggregates: Aggregates;
  time_series: TimeSeries;
}

export interface StatisticsFilters {
  vehicle?: number;
  period?: '30d' | '90d' | 'ytd' | 'custom';
  date_after?: string;
  date_before?: string;
}

export interface BrandStats {
  brand: string;
  average_consumption: number;
  average_unit_price: number;
  average_cost_per_km: number;
  fill_count: number;
}

export interface GradeStats {
  grade: string;
  average_consumption: number;
  average_unit_price: number;
  average_cost_per_km: number;
  fill_count: number;
}
