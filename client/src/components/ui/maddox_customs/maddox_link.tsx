import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/types/utils';

function Maddox_Link({ className, ...props }: React.ComponentProps<'a'>) {
  return <a className={cn('bg-amber-100')} {...props} />;
}

export { Maddox_Link };
