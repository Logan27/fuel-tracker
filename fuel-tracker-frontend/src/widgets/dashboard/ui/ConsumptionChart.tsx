import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeSeries } from '@/entities/statistics';
import { useUnitConversion } from '@/shared/lib/hooks/useUnitConversion';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/shared/ui/skeleton';

interface ConsumptionChartProps {
  data?: TimeSeries['consumption'];
  isLoading?: boolean;
}

export const ConsumptionChart = ({ data, isLoading }: ConsumptionChartProps) => {
  const { convertConsumptionFromMetric, getConsumptionUnitLabel } = useUnitConversion();

  const consumptionUnit = getConsumptionUnitLabel;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fuel Consumption Over Time</CardTitle>
          <CardDescription>Track your fuel efficiency trends</CardDescription>
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
          <CardTitle>Fuel Consumption Over Time</CardTitle>
          <CardDescription>Track your fuel efficiency trends</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No consumption data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((point) => ({
    date: format(parseISO(point.date), 'MMM dd'),
    consumption: convertConsumptionFromMetric(point.value),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuel Consumption Over Time</CardTitle>
        <CardDescription>
          Average consumption in {consumptionUnit()}
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
              label={{ value: consumptionUnit(), angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-2 shadow-lg">
                      <p className="text-sm font-medium">{payload[0].payload.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {payload[0].value} {consumptionUnit()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="consumption"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

