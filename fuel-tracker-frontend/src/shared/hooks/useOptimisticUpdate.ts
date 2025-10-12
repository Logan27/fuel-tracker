import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface OptimisticUpdateOptions<T> {
  queryKey: (string | number)[];
  updateFn: (oldData: T | undefined, newItem: T) => T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollback: () => void) => void;
}

export const useOptimisticUpdate = <T>({
  queryKey,
  updateFn,
  onSuccess,
  onError,
}: OptimisticUpdateOptions<T>) => {
  const queryClient = useQueryClient();
  const [isOptimistic, setIsOptimistic] = useState(false);

  const optimisticUpdate = useCallback(
    async (newItem: T, mutationFn: () => Promise<T>) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<T>(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData<T>(queryKey, (old) => updateFn(old, newItem));
      setIsOptimistic(true);

      try {
        // Perform the actual mutation
        const result = await mutationFn();
        
        // Update with the real data from server
        queryClient.setQueryData<T>(queryKey, result);
        setIsOptimistic(false);
        
        onSuccess?.(result);
        return result;
      } catch (error) {
        // If the mutation fails, rollback to the previous value
        queryClient.setQueryData<T>(queryKey, previousData);
        setIsOptimistic(false);
        
        const rollback = () => {
          queryClient.setQueryData<T>(queryKey, previousData);
        };
        
        onError?.(error as Error, rollback);
        throw error;
      }
    },
    [queryClient, queryKey, updateFn, onSuccess, onError]
  );

  return {
    optimisticUpdate,
    isOptimistic,
  };
};

// Helper for adding items to lists
export const useOptimisticAdd = <T extends { id: number | string }>(
  queryKey: (string | number)[]
) => {
  return useOptimisticUpdate<T[]>({
    queryKey,
    updateFn: (oldData, newItem) => {
      if (!oldData) return [newItem];
      return [...oldData, newItem];
    },
  });
};

// Helper for updating items in lists
export const useOptimisticUpdateItem = <T extends { id: number | string }>(
  queryKey: (string | number)[]
) => {
  return useOptimisticUpdate<T[]>({
    queryKey,
    updateFn: (oldData, updatedItem) => {
      if (!oldData) return [updatedItem];
      return oldData.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      );
    },
  });
};

// Helper for removing items from lists
export const useOptimisticRemove = <T extends { id: number | string }>(
  queryKey: (string | number)[]
) => {
  return useOptimisticUpdate<T[]>({
    queryKey,
    updateFn: (oldData, itemToRemove) => {
      if (!oldData) return [];
      return oldData.filter((item) => item.id !== itemToRemove.id);
    },
  });
};
