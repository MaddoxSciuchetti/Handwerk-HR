'use client';

import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        'relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
        style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
