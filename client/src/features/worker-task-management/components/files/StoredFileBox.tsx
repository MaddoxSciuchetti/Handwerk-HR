import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

type StoredFileBoxProps = {
  label: string;
  icon: LucideIcon;
  onOpen: () => void;
};

export function StoredFileBox({ label, icon: Icon, onOpen }: StoredFileBoxProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={label}
      onClick={onOpen}
      className="h-auto flex-col items-start gap-3 rounded-xl border border-border p-4 text-left font-normal hover:bg-(--dropdown-surface) hover:text-foreground"
    >
      <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      <span className="block truncate text-sm font-medium">{label}</span>
    </Button>
  );
}
