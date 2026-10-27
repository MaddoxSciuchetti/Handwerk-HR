import { type ReactNode } from 'react';
import { Skeleton } from './skeleton';
import { TableCell, TableRow } from './table';

type TableSkeletonVariant =
  | 'clothing'
  | 'materials'
  | 'workers'
  | 'team'
  | 'tasks'
  | 'employees'
  | 'stock'
  | 'templates'
  | 'documents';

// Render inside the real table body so headers, spacing and scrolling stay put.
export function TableSkeletonRows({
  variant,
  rows = 6,
  cellClassName,
}: {
  variant: TableSkeletonVariant;
  rows?: number;
  cellClassName?: string;
}) {
  const line = (width: string) => <Skeleton className={`h-4 ${width}`} />;
  const cells = (index: number): ReactNode[] => {
    const name = line(index % 2 ? 'w-28' : 'w-36');
    switch (variant) {
      case 'clothing':
        return [
          name,
          line('w-10'),
          line('w-8'),
          line('w-24'),
          line('w-5'),
          <Skeleton className="h-7 w-24 rounded-2xl" />,
          <Skeleton className="ml-auto size-7" />,
        ];
      case 'materials':
        return [
          <Skeleton className="h-9 w-full min-w-28" />,
          <Skeleton className="h-9 w-full min-w-24" />,
          <Skeleton className="h-9 w-full min-w-16" />,
          <div className="space-y-1">
            <Skeleton className="h-9 w-full min-w-24" />
            <Skeleton className="h-4 w-16" />
          </div>,
          <div className="flex justify-end gap-2">
            <Skeleton className="h-7 w-20 rounded-2xl" />
            <Skeleton className="h-7 w-16 rounded-2xl" />
          </div>,
        ];
      case 'workers':
        return [
          <div className="inline-flex h-8 items-center gap-2">
            {name}
            <Skeleton className="size-4 rounded-full" />
          </div>,
          line('w-24'),
          line('w-24'),
          line('w-5'),
          <Skeleton className="h-7 w-16 rounded-full" />,
        ];
      case 'team':
        return [
          <div className="inline-flex h-8 items-center gap-2">
            {name}
            <Skeleton className="size-4 rounded-full" />
          </div>,
        ];
      case 'tasks':
        return [
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-4 rounded-full" />
            {name}
          </div>,
          <div className="flex justify-end gap-2">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>,
        ];
      case 'employees':
        return [
          name,
          line('w-5'),
          line('w-20'),
          line('w-24'),
          <Skeleton className="size-8 rounded-md" />,
        ];
      case 'stock':
        return [name, line('w-10'), <Skeleton className="h-9 w-24" />];
      case 'templates':
        return [name, <Skeleton className="ml-auto h-8 w-20 rounded-2xl" />];
      case 'documents':
        return [
          <div className="h-12 w-10" />,
          name,
          <Skeleton className="h-6 w-28 rounded-full" />,
        ];
    }
  };

  return Array.from({ length: rows }, (_, row) => (
    <TableRow
      key={row}
      className={
        variant === 'materials'
          ? 'border-b border-border last:border-0 hover:bg-transparent'
          : 'border-0 hover:bg-transparent'
      }
    >
      {cells(row).map((content, column) => (
        <TableCell
          key={column}
          className={
            cellClassName ??
            (variant === 'documents' && column === 0
              ? 'w-10 !p-0'
              : 'px-2 py-4 first:pl-10')
          }
        >
          {row === 0 && column === 0 ? (
            <span role="status" className="sr-only">
              Daten werden geladen…
            </span>
          ) : null}
          <div aria-hidden="true">{content}</div>
        </TableCell>
      ))}
    </TableRow>
  ));
}
