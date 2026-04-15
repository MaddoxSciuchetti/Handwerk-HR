import * as React from 'react';

import { cn } from '@/lib/trycatch';

export type SelfmadeInputProps = React.ComponentProps<'input'> & {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  wrapperClassName?: string;
};

const Input = React.forwardRef<HTMLInputElement, SelfmadeInputProps>(
  (
    {
      className,
      wrapperClassName,
      startIcon,
      endIcon,
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        data-slot="input"
        className={cn(
          'min-h-0 min-w-0 flex-1 border-0 bg-transparent p-0',
          'typo-body-sm text-text-primary placeholder:text-text-disabled flex h-[var(--size-input-h)] min-h-[var(--size-input-h)] w-full min-w-0 items-center gap-2 overflow-hidden rounded-md border border-border-default bg-surface-page px-3 py-0',
          'outline-none focus:ring-0 focus-visible:ring-0',
          'disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
