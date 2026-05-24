import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

function Table({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mt-5 flex h-full min-h-0 w-full flex-col flex-start gap-2 overflow-hidden rounded-2xl border-2 border-border bg-transparent p-3',
        className
      )}
    >
      {children}
    </div>
  );
}

function TableDivider() {
  return <div className="shrink-0 border-b-2 border-border" />;
}

type TableHeaderProps = {
  children: ReactNode;
  className?: string;
};

function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <div
      className={cn(
        'flex w-full shrink-0 items-center gap-3 bg-transparent px-1 pb-1',
        className
      )}
    >
      {children}
    </div>
  );
}

function GrowingItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex grow items-center gap-10 py-5', className)}>
      {children}
    </div>
  );
}

function Cell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('ds-label-lg w-42.5 items-center', className)}>
      {children}
    </div>
  );
}

function CellHolder({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 items-center', className ?? 'w-150')}>
      {children}
    </div>
  );
}

function ItemHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full items-center px-3 pb-1', className)}>
      {children}
    </div>
  );
}

const employeeTableGridClassName =
  'grid w-full grid-cols-[minmax(0,1fr)_10.625rem_10.625rem_10.625rem_10.625rem] items-center gap-x-4';

type ItemState = 'default' | 'hover' | 'active';

const itemsState: Record<ItemState, string> = {
  default: 'bg-transparent',
  hover: 'hover:bg-muted/60',
  active: 'bg-muted',
};

type ItemsProps = {
  state: ItemState;
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

function Items({ state, children, className, ...props }: ItemsProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center rounded-2xl px-3 py-3',
        className,
        itemsState[state]
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  Cell,
  CellHolder,
  GrowingItem,
  ItemHeader,
  Items,
  Table,
  TableDivider,
  TableHeader,
  employeeTableGridClassName,
};
