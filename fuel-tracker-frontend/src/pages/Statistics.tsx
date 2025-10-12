import { useMemo } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { BarChart3 } from 'lucide-react';
import { BrandComparisonTable, useBrandStatistics } from '@/features/brand-statistics';
import { GradeComparisonTable, useGradeStatistics } from '@/features/grade-statistics';
import { VehicleSelector } from '@/widgets/vehicle-selector';
import { useVehicleStore } from '@/app/stores';
import { DashboardLayout } from '@/widgets/dashboard/ui/DashboardLayout';

const Statistics = () => {
  const selectedVehicleId = useVehicleStore((state) => state.selectedVehicleId);

  const filters = useMemo(() => 
    selectedVehicleId ? { vehicle: selectedVehicleId } : undefined
  , [selectedVehicleId]);

  const { data: brandData, isLoading: isBrandLoading } = useBrandStatistics(filters);
  const { data: gradeData, isLoading: isGradeLoading } = useGradeStatistics(filters);

  const hasNoData =
    !isBrandLoading &&
    !isGradeLoading &&
    (!brandData || brandData.length === 0) &&
    (!gradeData || gradeData.length === 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Statistics</h1>
          <p className="text-muted-foreground">
            Detailed analysis of your fuel consumption by brand and grade
          </p>
        </div>

        {hasNoData ? (
          /* Empty State */
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Statistics Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add at least 3 fuel entries with different brands or grades to see
                meaningful statistics and comparisons.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Statistics Content */
          <div className="space-y-8">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <VehicleSelector />
            </div>

            {/* Comparison Tables */}
            <div className="space-y-8">
              <BrandComparisonTable data={brandData} isLoading={isBrandLoading} />
              <GradeComparisonTable data={gradeData} isLoading={isGradeLoading} />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Statistics;

