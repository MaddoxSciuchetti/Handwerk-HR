import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/trycatch';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full  transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-interactive-primary-bg ',
        hover: 'bg-interactive-primary-hover',
        pressed: 'bg-interactive-primary-active',
        focused: 'bg-interactive-primary-focus',
        disabled: 'bg-interactive-primary-disabled',
      },
      size: {
        default: '',
        small: '',
        lg: '',
      },
      radius: {
        default: 'rounded-xl',
        lg: 'rounded-2xl',
        xl: 'rounded-3xl',
      },
      hierachy: {
        primary: 'bg-interactive-primary-bg',
        secondary: 'bg-interactive-secondary-bg',
        ghost: 'bg-interactive-ghost-bg',
        danger: 'bg-interactive-danger-bg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      radius: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant = 'default',
  size = 'default',
  radius = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, radius }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
