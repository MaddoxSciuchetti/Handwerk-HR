import { Button } from '@/components/ui/button';
import { Loader2, Printer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function FilePrintButton({
  label,
  onPrint,
  className,
}: {
  label: string;
  onPrint: () => Promise<void>;
  className?: string;
}) {
  const [printing, setPrinting] = useState(false);
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-label={`${label} drucken`}
      title="Drucken"
      disabled={printing}
      aria-busy={printing}
      className={cn(
        'text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100',
        printing && 'opacity-100',
        className
      )}
      onClick={async (event) => {
        event.stopPropagation();
        setPrinting(true);
        try {
          await onPrint();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Die Datei konnte nicht gedruckt werden.'
          );
        } finally {
          setPrinting(false);
        }
      }}
    >
      {printing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
    </Button>
  );
}
