import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { Download } from 'lucide-react';
import type { GradeStats } from '@/entities/statistics';
import { useUnitConversion } from '@/shared/lib/hooks/useUnitConversion';
import { formatNumber } from '@/shared/lib/utils';

interface GradeComparisonTableProps {
  data?: GradeStats[];
  isLoading?: boolean;
}

export const GradeComparisonTable = ({
  data,
  isLoading,
}: GradeComparisonTableProps) => {
  const {
    formatCurrency,
    formatPrice,
    formatConsumption,
    getConsumptionUnitLabel,
    getVolumeUnitLabel,
  } = useUnitConversion();

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;

    const headers = ['Grade', 'Avg Consumption', 'Avg Price', 'Fill-ups'];
    const csvContent = [
      headers.join(','),
      ...data.map(grade => [
        `"${grade.grade}"`,
        formatConsumption(grade.average_consumption),
        `${formatPrice(grade.average_unit_price)}/${getVolumeUnitLabel()}`,
        grade.fill_count
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'grade-statistics.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fuel Grade Comparison</CardTitle>
          <CardDescription>Compare performance across different fuel grades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fuel Grade Comparison</CardTitle>
          <CardDescription>Compare performance across different fuel grades</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No grade comparison data available. Add more fuel entries to see statistics.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by fill-up count descending
  const sortedData = [...data].sort((a, b) => b.fill_count - a.fill_count);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fuel Grade Comparison</CardTitle>
            <CardDescription>Compare performance across different fuel grades</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!data || data.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grade</TableHead>
              <TableHead className="text-right">Avg Consumption</TableHead>
              <TableHead className="text-right">Avg Price</TableHead>
              <TableHead className="text-right">Fill-ups</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((grade) => (
              <TableRow key={grade.grade}>
                <TableCell className="font-medium">{grade.grade}</TableCell>
                <TableCell className="text-right">
                  {formatConsumption(grade.average_consumption)}
                </TableCell>
                <TableCell className="text-right">
                  {formatPrice(grade.average_unit_price)}/{getVolumeUnitLabel()}
                </TableCell>
                <TableCell className="text-right">{grade.fill_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

