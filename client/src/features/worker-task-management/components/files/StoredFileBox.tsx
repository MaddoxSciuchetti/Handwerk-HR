import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { FilePrintButton } from './FilePrintButton';
import { cn } from '@/lib/utils';

type StoredFileBoxProps = Omit<ComponentProps<'button'>, 'children'> & {
  label: string;
  icon: LucideIcon;
  onOpen: () => void;
  onPrint?: () => Promise<void>;
};

export function StoredFileBox({
  label,
  icon: Icon,
  onOpen,
  onPrint,
  className,
  ...props
}: StoredFileBoxProps) {
  return (
    <div className="group relative min-w-0">
      <Button
        type="button"
        variant="ghost"
        aria-label={label}
        onClick={onOpen}
        className={cn(
          'h-full w-full flex-col items-start gap-3 rounded-xl border border-border p-4 text-left font-normal hover:bg-(--dropdown-surface) hover:text-foreground focus-visible:ring-0 focus-visible:border-muted-foreground',
          className
        )}
        {...props}
      >
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
        <span className="block truncate text-sm font-medium">{label}</span>
      </Button>
      {onPrint ? (
        <FilePrintButton
          label={label}
          onPrint={onPrint}
          className="absolute right-2 top-2"
        />
      ) : null}
    </div>
  );
}
