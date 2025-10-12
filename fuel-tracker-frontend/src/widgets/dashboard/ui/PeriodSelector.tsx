import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/shared/lib/utils';

export type PeriodType = '30d' | '90d' | 'ytd' | 'custom';

interface PeriodSelectorProps {
  value: PeriodType;
  onChange: (period: PeriodType, dateRange?: { from: Date; to: Date }) => void;
  className?: string;
}

export const PeriodSelector = ({
  value,
  onChange,
  className,
}: PeriodSelectorProps) => {
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const handlePeriodChange = (newPeriod: PeriodType) => {
    if (newPeriod === 'custom') {
      // Wait for custom date selection
      onChange(newPeriod);
    } else {
      onChange(newPeriod);
    }
  };

  const handleCustomRangeApply = () => {
    if (dateFrom && dateTo) {
      const range = { from: dateFrom, to: dateTo };
      setCustomRange(range);
      onChange('custom', range);
    }
  };

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <Select value={value} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="ytd">Year to date</SelectItem>
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>

      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !dateFrom && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'PPP') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !dateTo && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PPP') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                disabled={(date) => date > new Date() || (dateFrom ? date < dateFrom : false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={handleCustomRangeApply}
            disabled={!dateFrom || !dateTo}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};

