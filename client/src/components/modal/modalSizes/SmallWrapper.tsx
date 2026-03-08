import { cn } from '@/lib/trycatch';
import { ReactNode } from 'react';

type SmappWrapperProps = { children: ReactNode; className?: string };

const SmallWrapper = ({ children, className }: SmappWrapperProps) => {
  return (
    <div
      className={cn(
        'z-50 justify-center items-center mx-auto flex min-h-120 max-h-120 w-full max-w-md flex-col rounded-xl border bg-gray-200 p-6',
        className
      )}
    >
      <div className="flex w-full flex-col">{children}</div>
    </div>
  );
};

export default SmallWrapper;
