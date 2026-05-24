import { cn } from '@/lib/trycatch';
import React, { HTMLAttributes, ReactNode } from 'react';
import '../../../../../globals.css';

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
        'flex mt-5 w-full h-full flex-col flex-start rounded-2xl border-2 border-border bg-transparent',
        className
      )}
    >
      {children}
    </div>
  );
}

function TableDivider() {
  return <div className="border-b-2 border-border" />;
}

type TableHeaderProps = {
  children: ReactNode;
  className?: string;
};

function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <div
      className={cn(
        'px-2 flex w-full items-center gap-10 bg-transparent',
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
    <div className={cn(`flex grow py-5 items-center gap-10`, className)}>
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
    <div className={cn(`ds-label-lg w-42.5 items-center`, className)}>
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
    <div className={cn(`flex items-center w-full`, className)}>{children}</div>
  );
}
type ItemState = 'default' | 'hover' | 'active';

const ItemsState: Record<ItemState, string> = {
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
        `flex items-center relative group py-4 rounded-2xl`,
        className,
        ItemsState[state]
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
};
