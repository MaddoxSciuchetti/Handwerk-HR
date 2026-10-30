import { Table } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

type WorkerTableProps = ComponentProps<typeof Table> & {
  hideTaskColumns?: boolean;
  extraColumnCount?: number;
};

function columnWidths(hideTaskColumns: boolean, extraColumnCount: number) {
  if (hideTaskColumns) {
    if (extraColumnCount >= 3) return [24, 16, 20, 13, 13, 14];
    if (extraColumnCount === 2) return [28, 18, 24, 15, 15];
    if (extraColumnCount === 1) return [32, 20, 28, 20];
    return [40, 25, 35];
  }
  if (extraColumnCount >= 3) return [18, 12, 18, 9, 9, 11, 11, 12];
  if (extraColumnCount === 2) return [20, 14, 20, 10, 10, 13, 13];
  if (extraColumnCount === 1) return [24, 16, 24, 10, 10, 16];
  return [28, 18, 30, 12, 12];
}

function minWidthClass(hideTaskColumns: boolean, extraColumnCount: number) {
  if (extraColumnCount >= 3) {
    return hideTaskColumns ? 'min-w-240' : 'min-w-280';
  }
  if (extraColumnCount === 2) {
    return hideTaskColumns ? 'min-w-220' : 'min-w-260';
  }
  if (extraColumnCount === 1) {
    return hideTaskColumns ? 'min-w-200' : 'min-w-240';
  }
  return hideTaskColumns ? 'min-w-160' : 'min-w-200';
}

export function WorkerTable({
  hideTaskColumns = false,
  extraColumnCount = 0,
  className,
  children,
  ...props
}: WorkerTableProps) {
  const widths = columnWidths(hideTaskColumns, extraColumnCount);

  return (
    <Table
      {...props}
      className={cn(
        // separate borders so sticky header backgrounds/z-index paint above rows
        'table-fixed border-separate border-spacing-0',
        minWidthClass(hideTaskColumns, extraColumnCount),
        className
      )}
    >
      {/* Type changes replace task/status content; it must not size the columns. */}
      <colgroup>
        {widths.map((width, index) => (
          <col key={index} style={{ width: `${width}%` }} />
        ))}
      </colgroup>
      {children}
    </Table>
  );
}
