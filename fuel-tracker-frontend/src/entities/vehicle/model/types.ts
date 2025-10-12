export interface Vehicle {
  id: number;
  user_id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  fuel_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleDto {
  name: string;
  make?: string;
  model?: string;
  year?: number;
  fuel_type?: string;
  is_active?: boolean;
}

export interface UpdateVehicleDto {
  name?: string;
  make?: string;
  model?: string;
  year?: number;
  fuel_type?: string;
  is_active?: boolean;
}
