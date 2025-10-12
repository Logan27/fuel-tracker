import * as React from "react";
import { cn } from "@/lib/utils";
import { useResponsive } from "../hooks/useResponsive";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  mobile?: {
    title: string;
    priority: 'high' | 'medium' | 'low';
  };
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function ResponsiveTable<T extends { id: string | number }>({
  data,
  columns,
  onSort,
  sortBy,
  sortDirection,
  onRowClick,
  actions,
  emptyMessage = "No data available",
  className,
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet } = useResponsive();
  const [expandedRows, setExpandedRows] = React.useState<Set<string | number>>(new Set());

  const toggleRow = (id: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getValue = (item: T, key: string | keyof T) => {
    if (typeof key === 'string') {
      return key.split('.').reduce((obj, k) => obj?.[k], item as any);
    }
    return item[key];
  };

  const renderCell = (item: T, column: Column<T>) => {
    const value = getValue(item, column.key);
    return column.render ? column.render(value, item) : value;
  };

  if (isMobile) {
    return (
      <div className={cn("space-y-2", className)}>
        {data.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {emptyMessage}
            </CardContent>
          </Card>
        ) : (
          data.map((item) => {
            const isExpanded = expandedRows.has(item.id);
            const highPriorityColumns = columns.filter(col => col.mobile?.priority === 'high');
            const mediumPriorityColumns = columns.filter(col => col.mobile?.priority === 'medium');
            const lowPriorityColumns = columns.filter(col => col.mobile?.priority === 'low');

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Main row content */}
                  <div
                    className={cn(
                      "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {/* High priority columns */}
                        <div className="space-y-1">
                          {highPriorityColumns.map((column) => (
                            <div key={String(column.key)} className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                {column.mobile?.title || column.title}:
                              </span>
                              <span className="text-sm">
                                {renderCell(item, column)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Medium priority columns (if not expanded) */}
                        {!isExpanded && mediumPriorityColumns.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {mediumPriorityColumns.slice(0, 2).map((column) => (
                              <div key={String(column.key)} className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {column.mobile?.title || column.title}:
                                </span>
                                <span className="text-xs">
                                  {renderCell(item, column)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {actions && (
                          <div onClick={(e) => e.stopPropagation()}>
                            {actions(item)}
                          </div>
                        )}
                        {(mediumPriorityColumns.length > 2 || lowPriorityColumns.length > 0) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(item.id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t bg-muted/25 p-4 space-y-2">
                      {/* Remaining medium priority columns */}
                      {mediumPriorityColumns.slice(2).map((column) => (
                        <div key={String(column.key)} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {column.mobile?.title || column.title}:
                          </span>
                          <span className="text-sm">
                            {renderCell(item, column)}
                          </span>
                        </div>
                      ))}

                      {/* Low priority columns */}
                      {lowPriorityColumns.map((column) => (
                        <div key={String(column.key)} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {column.mobile?.title || column.title}:
                          </span>
                          <span className="text-sm">
                            {renderCell(item, column)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn("rounded-md border", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                    column.sortable && "cursor-pointer hover:bg-muted/80"
                  )}
                  onClick={() => column.sortable && onSort?.(String(column.key), sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={cn(
                            "h-3 w-3",
                            sortBy === column.key && sortDirection === 'asc' && "text-foreground"
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 -mt-1",
                            sortBy === column.key && sortDirection === 'desc' && "text-foreground"
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="h-12 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className="p-4 align-middle">
                      {renderCell(item, column)}
                    </td>
                  ))}
                  {actions && (
                    <td className="p-4 text-right">
                      <div onClick={(e) => e.stopPropagation()}>
                        {actions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
