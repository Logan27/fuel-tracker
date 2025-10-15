import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';
import { userApi } from '@/entities/user';

export const ExportDataButton = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await userApi.exportData();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fuel-tracker-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      
      // Clear
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export data';
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      {isExporting ? 'Exporting...' : 'Export My Data'}
    </Button>
  );
};

