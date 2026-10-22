import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';

type EditableTextRowProps = {
  label: string;
  value: string;
  isDisabled?: boolean;
  type?: 'text' | 'email';
  onChangeValue: (value: string) => void;
  onBlur: () => void;
};

export function EditableTextRow({
  label,
  value,
  isDisabled = false,
  type = 'text',
  onChangeValue,
  onBlur,
}: EditableTextRowProps) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell>
        <p className="typo-body-sm">{label}</p>
      </TableCell>
      <TableCell className="w-72">
        <Input
          type={type}
          aria-label={label}
          value={value}
          disabled={isDisabled}
          placeholder={label}
          onBlur={onBlur}
          onChange={(event) => onChangeValue(event.target.value)}
          className="h-8 bg-muted text-sm shadow-none focus-visible:border-border focus-visible:ring-0 dark:bg-muted"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
      </TableCell>
    </TableRow>
  );
}
