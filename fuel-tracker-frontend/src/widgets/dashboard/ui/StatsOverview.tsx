import { StatCard } from './StatCard';
import { Fuel, TrendingUp, Coins, Gauge, MapPin, Calendar } from 'lucide-react';
import { Aggregates } from '@/entities/statistics';
import { useUnitConversion } from '@/shared/lib/hooks/useUnitConversion';

interface StatsOverviewProps {
  aggregates?: Aggregates;
  isLoading?: boolean;
}

export const StatsOverview = ({ aggregates, isLoading }: StatsOverviewProps) => {
  const {
    formatDistance,
    formatVolume,
    formatConsumption,
    formatCurrency,
    formatPrice,
    convertDistanceFromKm,
    convertVolumeFromLiters,
    getDistanceUnitLabel,
    getVolumeUnitLabel,
    getConsumptionUnitLabel,
  } = useUnitConversion();

  const distanceUnit = getDistanceUnitLabel;
  const volumeUnit = getVolumeUnitLabel;
  const consumptionUnit = getConsumptionUnitLabel;

  // Конвертируем unit price из цены за литр в цену за выбранную единицу объема
  const convertUnitPrice = (pricePerLiter: number): number => {
    // Если единица измерения - галлоны, конвертируем цену
    // 1 gallon = 3.78541 liters, поэтому цена за галлон = цена за литр * 3.78541
    const volumeInTargetUnit = convertVolumeFromLiters(1); // Конвертируем 1 литр в целевую единицу
    return pricePerLiter * volumeInTargetUnit;
  };

  // Конвертируем cost per km в cost per выбранную единицу расстояния
  const convertCostPerDistance = (costPerKm: number): number => {
    // Если единица измерения - мили, конвертируем стоимость
    // 1 mile = 1.60934 km, поэтому cost per mile = cost per km * 1.60934
    const distanceRatio = convertDistanceFromKm(1); // Конвертируем 1 км в целевую единицу
    return costPerKm * distanceRatio;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Average Consumption"
        value={
          aggregates?.average_consumption
            ? formatConsumption(aggregates.average_consumption)
            : 'N/A'
        }
        icon={TrendingUp}
        description="Per 100km average fuel usage"
        isLoading={isLoading}
      />

      <StatCard
        title="Average Price"
        value={
          aggregates?.average_unit_price
            ? `${formatPrice(convertUnitPrice(aggregates.average_unit_price))}/${volumeUnit()}`
            : 'N/A'
        }
        icon={Coins}
        description="Average fuel unit price"
        isLoading={isLoading}
      />

      <StatCard
        title="Total Spent"
        value={
          aggregates?.total_spent
            ? formatCurrency(aggregates.total_spent)
            : 'N/A'
        }
        icon={Coins}
        description="Total money spent on fuel"
        isLoading={isLoading}
      />

      <StatCard
        title="Total Distance"
        value={
          aggregates?.total_distance
            ? formatDistance(aggregates.total_distance)
            : 'N/A'
        }
        icon={MapPin}
        description="Total distance traveled"
        isLoading={isLoading}
      />

      <StatCard
        title="Average Cost per km"
        value={
          aggregates?.average_cost_per_km
            ? `${formatCurrency(convertCostPerDistance(aggregates.average_cost_per_km))}/${distanceUnit()}`
            : 'N/A'
        }
        icon={Coins}
        description="Average cost per distance"
        isLoading={isLoading}
      />

      <StatCard
        title="Average Distance/Day"
        value={
          aggregates?.average_distance_per_day
            ? `${Math.round(convertDistanceFromKm(aggregates.average_distance_per_day))} ${distanceUnit()}/day`
            : 'N/A'
        }
        icon={Calendar}
        description="Average distance per day"
        isLoading={isLoading}
      />
    </div>
  );
};

