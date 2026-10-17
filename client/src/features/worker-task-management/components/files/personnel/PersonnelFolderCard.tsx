import { Folder } from 'lucide-react';

type PersonnelFolderCardProps = {
  label: string;
  count: number;
  onOpen: () => void;
};

function countLabel(count: number) {
  if (count === 0) return 'Leer';
  if (count === 1) return '1 Datei';
  return `${count} Dateien`;
}

export function PersonnelFolderCard({
  label,
  count,
  onOpen,
}: PersonnelFolderCardProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onOpen}
      className="flex flex-col items-start gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:bg-(--dropdown-surface)"
    >
      <Folder className="h-8 w-8 text-muted-foreground" aria-hidden />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">
          {countLabel(count)}
        </span>
      </span>
    </button>
  );
}
