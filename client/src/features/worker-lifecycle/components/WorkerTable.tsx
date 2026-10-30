import { Table } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

type WorkerTableProps = ComponentProps<typeof Table> & {
  hideTaskColumns?: boolean;
  showAnniversary?: boolean;
};

export function WorkerTable({
  hideTaskColumns = false,
  showAnniversary = false,
  className,
  children,
  ...props
}: WorkerTableProps) {
  const widths = hideTaskColumns
    ? showAnniversary
      ? [32, 20, 28, 20]
      : [40, 25, 35]
    : showAnniversary
      ? [24, 16, 24, 10, 10, 16]
      : [28, 18, 30, 12, 12];

  return (
    <Table
      {...props}
      className={cn(
        // separate borders so sticky header backgrounds/z-index paint above rows
        'table-fixed border-separate border-spacing-0',
        showAnniversary
          ? hideTaskColumns
            ? 'min-w-200'
            : 'min-w-240'
          : hideTaskColumns
            ? 'min-w-160'
            : 'min-w-200',
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
