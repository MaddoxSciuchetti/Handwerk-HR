import { Input } from '@/components/ui/selfmade/input';
import { GrowingItem, Items } from '@/components/ui/selfmade/table/Table';

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
    <Items state="default" className="px-3 py-1">
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
          <button
            type="button"
            className="w-full rounded-md border border-transparent px-3 py-1.5 text-left typo-body-sm transition-colors hover:border-border-default hover:bg-accent"
            onClick={onClickValue}
          >
            {value || '-'}
          </button>
        )}
      </div>
    </Items>
  );
}
