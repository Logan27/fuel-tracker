import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fuelEntryApi } from '@/entities/fuel-entry';

export const useEntryActions = () => {
  const queryClient = useQueryClient();

  const { mutate: deleteEntry, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => fuelEntryApi.delete(id),
    onSuccess: () => {
      toast.success('Fuel entry deleted successfully');
      // Invalidate and refetch the entries list
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      // Also invalidate dashboard stats as they will change
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete fuel entry');
    },
  });

  return { deleteEntry, isDeleting };
};
