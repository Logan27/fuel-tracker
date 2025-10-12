import { Fuel } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface EmptyEntriesProps {
  onAddEntry?: () => void;
}

export const EmptyEntries = ({ onAddEntry }: EmptyEntriesProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Fuel className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No fuel entries yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start tracking your fuel consumption by adding your first refueling entry.
        You'll be able to see detailed statistics and trends.
      </p>
      {onAddEntry && (
        <Button onClick={onAddEntry} size="lg">
          <Fuel className="mr-2 h-4 w-4" />
          Add First Entry
        </Button>
      )}
    </div>
  );
};

