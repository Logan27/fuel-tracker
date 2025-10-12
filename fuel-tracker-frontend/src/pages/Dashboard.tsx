import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Plus, Fuel as FuelIcon } from 'lucide-react';
import { DashboardStatsSkeleton, ChartSkeleton } from '@/shared/ui/skeleton-loaders';
import {
  StatsOverview,
  ConsumptionChart,
  CostChart,
  PeriodSelector,
  useDashboardStats,
  type PeriodType,
} from '@/widgets/dashboard';
import { VehicleSelector } from '@/widgets/vehicle-selector';
import { DashboardLayout } from '@/widgets/dashboard/ui/DashboardLayout';
import { useVehicleStore } from '@/app/stores';
import type { StatisticsFilters } from '@/entities/statistics';

const Dashboard = () => {
  const navigate = useNavigate();
  const { selectedVehicleId } = useVehicleStore();

  const [period, setPeriod] = useState<PeriodType>('30d');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>();

  const filters: StatisticsFilters = {
    vehicle: selectedVehicleId ?? undefined,
    period: period,
    date_after: dateRange?.from.toISOString(),
    date_before: dateRange?.to.toISOString(),
  };

  const { data: stats, isLoading } = useDashboardStats(filters);

  const handlePeriodChange = (
    newPeriod: PeriodType,
    customRange?: { from: Date; to: Date }
  ) => {
    setPeriod(newPeriod);
    if (newPeriod === 'custom' && customRange) {
      setDateRange(customRange);
    } else {
      setDateRange(undefined);
    }
  };

  // Check if user has any data
  const hasNoData = !isLoading && stats?.aggregates.fill_up_count === 0;

  return (
    <DashboardLayout>
      {/* Page description */}
      <div className="mb-8">
        <p className="text-muted-foreground">
          Track your fuel consumption and expenses
        </p>
      </div>

      {isLoading ? (
        /* Loading State */
        <div className="space-y-8">
          {/* Stats Skeleton */}
          <DashboardStatsSkeleton />
          
          {/* Charts Skeleton */}
          <div className="grid gap-8 md:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      ) : hasNoData ? (
        /* Empty State */
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <FuelIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Fuel Entries Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start tracking your fuel consumption by adding your first refueling
              entry. You'll be able to see detailed statistics and trends.
            </p>
            <Button
              onClick={() => navigate('/entries/new')}
              className="gradient-hero"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Dashboard Content */
        <div className="space-y-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <VehicleSelector />
            <PeriodSelector value={period} onChange={handlePeriodChange} />
          </div>

          {/* Stats Overview */}
          <StatsOverview aggregates={stats?.aggregates} isLoading={isLoading} />

          {/* Charts */}
          <div className="grid gap-8 md:grid-cols-2">
            <ConsumptionChart
              data={stats?.time_series.consumption}
              isLoading={isLoading}
            />
            <CostChart
              data={stats?.time_series.unit_price}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
