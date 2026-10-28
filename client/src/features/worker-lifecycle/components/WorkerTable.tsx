import { Table } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

type WorkerTableProps = ComponentProps<typeof Table> & {
  hideTaskColumns?: boolean;
};

export function WorkerTable({
  hideTaskColumns = false,
  className,
  children,
  ...props
}: WorkerTableProps) {
  return (
    <Table
      {...props}
      className={cn(
        'table-fixed',
        hideTaskColumns ? 'min-w-160' : 'min-w-200',
        className
      )}
    >
      {/* Type changes replace task/status content; it must not size the columns. */}
      <colgroup>
        <col className={hideTaskColumns ? 'w-[40%]' : 'w-[28%]'} />
        <col className={hideTaskColumns ? 'w-[25%]' : 'w-[18%]'} />
        <col className={hideTaskColumns ? 'w-[35%]' : 'w-[30%]'} />
        {!hideTaskColumns && (
          <>
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </>
        )}
      </colgroup>
      {children}
    </Table>
  );
}
