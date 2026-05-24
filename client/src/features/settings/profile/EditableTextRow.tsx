import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GrowingItem, Items } from '@/features/settings/components/Table';

type EditableTextRowProps = {
  label: string;
  value: string;
  isEditing: boolean;
  isDisabled?: boolean;
  onClickValue: () => void;
  onChangeValue: (value: string) => void;
  onBlur: () => void;
};

export function EditableTextRow({
  label,
  value,
  isEditing,
  isDisabled = false,
  onClickValue,
  onChangeValue,
  onBlur,
}: EditableTextRowProps) {
  return (
    <Items state="default">
      <GrowingItem>
        <p className="typo-body-sm">{label}</p>
      </GrowingItem>
      <div className="w-72">
        {isEditing ? (
          <Input
            autoFocus
            value={value}
            disabled={isDisabled}
            onBlur={onBlur}
            onChange={(event) => onChangeValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-start rounded-md px-3 py-1.5 text-left font-normal typo-body-sm hover:bg-accent"
            onClick={onClickValue}
          >
            {value || '-'}
          </Button>
        )}
      </div>
    </Items>
  );
}
