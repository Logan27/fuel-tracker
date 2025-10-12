import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { fuelEntryApi } from '@/entities/fuel-entry';
import type { CreateFuelEntryDto, UpdateFuelEntryDto } from '@/entities/fuel-entry';
import type { EntryFormData } from './entrySchemas';
import { getErrorMessage, isAuthError, isNetworkError } from '@/shared/lib/error-handler';

/**
 * Хук для работы с формой fuel entry (создание/редактирование)
 */
export const useEntryForm = (entryId?: number) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Создание записи
  const createMutation = useMutation({
    mutationFn: (data: CreateFuelEntryDto) => fuelEntryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Fuel entry created successfully!');
      navigate('/entries');
    },
    onError: (error: any) => {
      const message = getErrorMessage(error);
      toast.error(message);
      
      // Если это ошибка аутентификации, перенаправляем на страницу входа
      if (isAuthError(error)) {
        navigate('/auth');
      }
    },
  });

  // Обновление записи
  const updateMutation = useMutation({
    mutationFn: (data: UpdateFuelEntryDto) => {
      if (!entryId) throw new Error('Entry ID is required for update');
      return fuelEntryApi.update(entryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-entry', entryId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Fuel entry updated successfully!');
      navigate('/entries');
    },
    onError: (error: any) => {
      const message = getErrorMessage(error);
      toast.error(message);
      
      // Если это ошибка аутентификации, перенаправляем на страницу входа
      if (isAuthError(error)) {
        navigate('/auth');
      }
    },
  });

  // Удаление записи
  const deleteMutation = useMutation({
    mutationFn: (id: number) => fuelEntryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Fuel entry deleted successfully!');
      navigate('/entries');
    },
    onError: (error: any) => {
      const message = getErrorMessage(error);
      toast.error(message);
      
      // Если это ошибка аутентификации, перенаправляем на страницу входа
      if (isAuthError(error)) {
        navigate('/auth');
      }
    },
  });

  const handleSubmit = (data: EntryFormData) => {
    console.log('=== ENTRY FORM SUBMISSION ===');
    console.log('Form data received:', data);
    console.log('Entry ID:', entryId);
    console.log('Vehicle ID:', data.vehicle_id);
    console.log('Liters:', data.liters);
    console.log('Total Amount:', data.total_amount);
    
    // Валидация обязательных полей
    if (!entryId && !data.vehicle_id) {
      console.log('ERROR: No vehicle selected');
      toast.error('Please select a vehicle');
      return;
    }
    if (!data.liters || !data.total_amount) {
      console.log('ERROR: Missing required fields');
      toast.error('Please fill in all required fields');
      return;
    }

    if (entryId) {
      // Обновление существующей записи (vehicle_id не передается)
      const updateData: UpdateFuelEntryDto = {
        entry_date: data.entry_date,
        odometer: data.odometer,
        station_name: data.station_name,
        fuel_brand: data.fuel_brand,
        fuel_grade: data.fuel_grade,
        liters: data.liters,
        total_amount: data.total_amount,
        notes: data.notes || '',
      };
      updateMutation.mutate(updateData);
    } else {
      // Создание новой записи
      const createData: CreateFuelEntryDto = {
        vehicle: data.vehicle_id,
        entry_date: data.entry_date,
        odometer: data.odometer,
        station_name: data.station_name,
        fuel_brand: data.fuel_brand,
        fuel_grade: data.fuel_grade,
        liters: data.liters,
        total_amount: data.total_amount,
        notes: data.notes || '',
      };
      console.log('[useEntryForm] createData:', createData);
      console.log('[useEntryForm] createData.vehicle:', createData.vehicle);
      console.log('[useEntryForm] createData JSON:', JSON.stringify(createData));
      createMutation.mutate(createData);
    }
  };

  const handleDelete = () => {
    if (entryId) {
      deleteMutation.mutate(entryId);
    }
  };

  return {
    handleSubmit,
    handleDelete,
    isLoading:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

