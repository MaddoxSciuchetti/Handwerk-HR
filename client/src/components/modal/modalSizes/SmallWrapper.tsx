import { cn } from '@/lib/trycatch';
import { ReactNode } from 'react';

type SmappWrapperProps = { children: ReactNode; className?: string };

const SmallWrapper = ({ children, className }: SmappWrapperProps) => {
  return (
    <div
      className={cn(
        'z-50 mx-auto flex h-120 w-full max-w-md flex-col items-center justify-center rounded-xl border border-border bg-(--modal-surface) p-6 text-foreground shadow-lg',
        className
      )}
    >
      <div className="flex h-full min-h-0 w-full flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default SmallWrapper;
