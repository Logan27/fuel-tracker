import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeSeries } from '@/entities/statistics';
import { useUnitConversion } from '@/shared/lib/hooks/useUnitConversion';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/shared/ui/skeleton';

interface CostChartProps {
  data?: TimeSeries['unit_price'];
  isLoading?: boolean;
}

export const CostChart = ({ data, isLoading }: CostChartProps) => {
  const { formatCurrency, getVolumeUnitLabel, currency } = useUnitConversion();
  const volumeUnit = getVolumeUnitLabel;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fuel Price Trends</CardTitle>
          <CardDescription>Track fuel price changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fuel Price Trends</CardTitle>
          <CardDescription>Track fuel price changes over time</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No price data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((point) => ({
    date: format(parseISO(point.date), 'MMM dd'),
    price: point.value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuel Price Trends</CardTitle>
        <CardDescription>
          Average price per {volumeUnit()} in {currency}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickMargin={10}
              label={{
                value: `${currency}/${volumeUnit()}`,
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-2 shadow-lg">
                      <p className="text-sm font-medium">{payload[0].payload.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(Number(payload[0].value))}/{volumeUnit()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

