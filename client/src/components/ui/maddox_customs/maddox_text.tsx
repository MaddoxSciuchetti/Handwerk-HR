import * as React from 'react';
import { cn } from '@/types/utils';
import { cva, type VariantProps } from 'class-variance-authority';

function Text({
  className,
  ...props
}: React.ComponentProps<'p'> & { shared?: boolean }) {
  return <p className={cn('flex')} {...props} />;
}

export { Text };
