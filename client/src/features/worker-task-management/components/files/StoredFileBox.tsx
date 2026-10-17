import type { LucideIcon } from 'lucide-react';

type StoredFileBoxProps = {
  label: string;
  icon: LucideIcon;
  onOpen: () => void;
};

export function StoredFileBox({ label, icon: Icon, onOpen }: StoredFileBoxProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onOpen}
      className="flex flex-col items-start gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:bg-(--dropdown-surface)"
    >
      <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      <span className="block truncate text-sm font-medium">{label}</span>
    </button>
  );
}
