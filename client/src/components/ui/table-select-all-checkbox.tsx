import { Checkbox } from '@/components/ui/checkbox';

type TableSelectAllCheckboxProps = {
  ids: string[];
  selectedIds: string[];
  disabled?: boolean;
  selectLabel: string;
  clearLabel: string;
  onCheckedChange: (checked: boolean) => void;
};

export function TableSelectAllCheckbox({
  ids,
  selectedIds,
  disabled = false,
  selectLabel,
  clearLabel,
  onCheckedChange,
}: TableSelectAllCheckboxProps) {
  const selected = new Set(selectedIds);
  const selectedVisible = ids.filter((id) => selected.has(id)).length;
  const allSelected = ids.length > 0 && selectedVisible === ids.length;
  const someSelected = selectedVisible > 0 && !allSelected;

  return (
    <Checkbox
      checked={allSelected ? true : someSelected ? 'indeterminate' : false}
      disabled={disabled || ids.length === 0}
      aria-label={allSelected ? clearLabel : selectLabel}
      className="relative cursor-pointer after:absolute after:-inset-3 after:content-['']"
      onCheckedChange={(checked) => onCheckedChange(checked === true)}
    />
  );
}
