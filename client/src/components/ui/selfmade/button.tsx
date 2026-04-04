import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/trycatch';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-brand-700 text-[var(--button-text-default)] hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--button-focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        hover: 'bg-brand-600 text-[var(--button-text-default)]',
        disabled:
          'pointer-events-none bg-[color-mix(in_srgb,var(--brand-100)_45%,transparent)] text-[color-mix(in_srgb,var(--brand-700)_45%,transparent)]',
        press: 'bg-brand-500 text-[var(--button-text-default)]',
        focus:
          'bg-brand-700 text-[var(--button-text-default)] ring-2 ring-[var(--button-focus-ring-color)] ring-offset-2 ring-offset-background',
        loading:
          'pointer-events-none cursor-wait bg-brand-700 text-[var(--button-text-default)] opacity-45',
      },
      size: {
        default:
          'h-10 min-h-10 px-4 text-sm [&_svg:not([class*=size-])]:size-4',
        sm: 'h-8 min-h-8 gap-1.5 px-3 text-xs [&_svg:not([class*=size-])]:size-3.5',
        lg: 'h-12 min-h-12 px-6 text-base [&_svg:not([class*=size-])]:size-[1.125rem]',
        icon: 'size-9 [&_svg:not([class*=size-])]:size-4',
        'icon-sm': 'size-8 [&_svg:not([class*=size-])]:size-3.5',
        'icon-lg': 'size-10 [&_svg:not([class*=size-])]:size-[1.125rem]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
