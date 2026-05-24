import { cn } from '@/lib/trycatch';
import type { ComponentProps } from 'react';

export type SidebarFooterProps = ComponentProps<'footer'>;

function SidebarFooter({ className, children, ...props }: SidebarFooterProps) {
  return (
    <footer
      className={cn(
        'flex justify-end mt-auto shrink-0 border-t border-border py-3',
        className
      )}
      {...props}
    >
      {children}
    </footer>
  );
}

export default SidebarFooter;
