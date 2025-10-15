import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { EmptyFuelEntries } from '@/shared/ui/empty-states';
import { ListSkeleton } from '@/shared/ui/skeleton-loaders';
import type { FuelEntry } from '@/entities/fuel-entry';
import type { Vehicle } from '@/entities/vehicle';
import { EntryTable } from './EntryTable';

interface EntryListProps {
  entries: FuelEntry[];
  vehicles: Vehicle[];
  isLoading?: boolean;
  isFetchingnextPage?: boolean;
  hasnextPage?: boolean;
  onLoadMore?: () => void;
  onEdit?: (entry: FuelEntry) => void;
  onDelete?: (entry: FuelEntry) => void;
  onViewDetails?: (entry: FuelEntry) => void;
  onAddEntry?: () => void;
}

export const EntryList = ({
  entries,
  vehicles,
  isLoading = false,
  isFetchingnextPage = false,
  hasnextPage = false,
  onLoadMore,
  onEdit,
  onDelete,
  onViewDetails,
  onAddEntry,
}: EntryListProps) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasnextPage && !isFetchingnextPage && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasnextPage, isFetchingnextPage, onLoadMore]);


  if (isLoading) {
    return <ListSkeleton items={5} />;
  }

  if (entries.length === 0) {
    return <EmptyFuelEntries onAddEntry={onAddEntry} />;
  }

  return (
    <div className="space-y-4">
      <EntryTable
        entries={entries}
        vehicles={vehicles}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewDetails={onViewDetails}
        showVehicleName={vehicles.length > 1}
      />

      {/* Infinite scroll trigger */}
      {hasnextPage && (
        <div ref={observerTarget} className="flex justify-center py-4">
          {isFetchingnextPage ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Button variant="outline" onClick={onLoadMore}>
              Load More
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

