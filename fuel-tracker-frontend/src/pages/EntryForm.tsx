import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { vehicleApi } from '@/entities/vehicle';
import { fuelEntryApi } from '@/entities/fuel-entry';
import { EntryForm, useEntryForm } from '@/features/entry-form';
import { useVehicleStore } from '@/app/stores';
import { DashboardLayout } from '@/widgets/dashboard/ui/DashboardLayout';

const EntryFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedVehicleId } = useVehicleStore();

  // Load vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleApi.getAll(),
  });

  // Load entry if editing
  const { data: entry, isLoading: isLoadingEntry } = useQuery({
    queryKey: ['fuel-entry', id],
    queryFn: () => fuelEntryApi.getById(parseInt(id!)),
    enabled: !!id,
  });

  // Entry form mutations
  const { handleSubmit, isLoading } = useEntryForm(id ? parseInt(id) : undefined);

  if (id && isLoadingEntry) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/entries')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Entries
          </Button>
          <h1 className="text-2xl font-bold mb-2">
            {id ? 'Edit' : 'Add'} Entry
          </h1>
          <p className="text-muted-foreground">
            {id
              ? 'Update fuel entry details'
              : 'Record a new fuel fill-up for your vehicle'}
          </p>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You need to add a vehicle before you can create fuel entries.
            </p>
            <Button onClick={() => navigate('/vehicles')}>Go to Vehicles</Button>
          </div>
        ) : (
          <EntryForm
            entry={entry}
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/entries')}
            isLoading={isLoading}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default EntryFormPage;
