import { cn } from '@/lib/trycatch';
import { FormHTMLAttributes, ReactNode } from 'react';

type FormWrapperProps = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'onSubmit'
> & {
  onSubmit: NonNullable<FormHTMLAttributes<HTMLFormElement>['onSubmit']>;
  children: ReactNode;
};

export function FormWrapper({
  children,
  onSubmit,
  className,
  ...props
}: FormWrapperProps) {
  return (
    <form onSubmit={onSubmit} className={cn(className)} {...props}>
      {children}
    </form>
  );
}
