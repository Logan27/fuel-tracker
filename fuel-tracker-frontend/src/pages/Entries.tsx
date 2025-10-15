import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useQuery } from '@tanstack/react-query';
import { vehicleApi } from '@/entities/vehicle';
import { toast } from 'sonner';
import { DashboardLayout } from '@/widgets/dashboard/ui/DashboardLayout';
import { EntryList, EntryFilters, useEntries } from '@/features/entry-list';
import { EntryDetails } from '@/features/entry-list/ui/EntryDetails';
import { useEntryFilters } from '@/features/entry-list/lib/useEntryFilters';
import { useEntryActions } from '@/features/entry-list/lib/useEntryActions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import type { FuelEntry } from '@/entities/fuel-entry';

const Entries = () => {
  const navigate = useNavigate();
  const [deleteEntry, setDeleteEntry] = useState<FuelEntry | null>(null);
  const [viewDetailsEntry, setViewDetailsEntry] = useState<FuelEntry | null>(null);

  // Load vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleApi.getAll(),
  });

  // Filters with URL sync
  const { filters, updateFilters, clearFilters } = useEntryFilters();

  // Load entries with pagination
  const {
    data,
    isLoading,
    isFetchingnextPage,
    hasnextPage,
    fetchnextPage,
  } = useEntries(filters);

  // Entry mutations
  const { deleteEntry: handleDelete, isDeleting } = useEntryActions();

  // Flatten paginated data
  const allEntries = data?.pages.flatMap((page) => page.results) || [];

  const handleViewDetails = (entry: FuelEntry) => {
    setViewDetailsEntry(entry);
  };

  const handleEdit = (entry: FuelEntry) => {
    navigate(`/entries/edit/${entry.id}`);
  };

  const handleDeleteConfirm = () => {
    if (deleteEntry) {
      handleDelete(deleteEntry.id);
      setDeleteEntry(null);
    }
  };

  return (
    <DashboardLayout>
      {/* Page description */}
      <div className="mb-8">
        <p className="text-muted-foreground">
          View and manage your fuel consumption records
        </p>
      </div>

      {/* Filters */}
      {vehicles.length > 0 && (
        <div className="mb-6">
          <EntryFilters
            vehicles={vehicles}
            filters={filters}
            onFilterChange={updateFilters}
            onClearFilters={clearFilters}
          />
        </div>
      )}

      {/* Entry List */}
      <EntryList
        entries={allEntries}
        vehicles={vehicles}
        isLoading={isLoading}
        isFetchingnextPage={isFetchingnextPage}
        hasnextPage={hasnextPage}
        onLoadMore={fetchnextPage}
        onEdit={handleEdit}
        onDelete={setDeleteEntry}
        onViewDetails={handleViewDetails}
        onAddEntry={() => navigate('/entries/new')}
      />

      {/* Entry Details Dialog */}
      <EntryDetails
        entry={viewDetailsEntry}
        isOpen={!!viewDetailsEntry}
        onClose={() => setViewDetailsEntry(null)}
        onEdit={handleEdit}
        onDelete={setDeleteEntry}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fuel Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fuel entry? This action cannot be undone.
              All associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Entry'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Entries;
