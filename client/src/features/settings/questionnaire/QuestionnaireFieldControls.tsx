import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuestionTitle } from './QuestionTitle';
import type { ContractFieldOption, TemplateField } from './questionnaireTemplate.types';

type QuestionnaireFieldControlsProps = {
  field: TemplateField;
  contractFields: ContractFieldOption[];
  onChange: (field: TemplateField) => void;
  onCommit: (field: TemplateField) => void;
};

export function QuestionnaireFieldControls({
  field,
  contractFields,
  onChange,
  onCommit,
}: QuestionnaireFieldControlsProps) {
  const patch = (next: Partial<TemplateField>) => onChange({ ...field, ...next });

  return (
    <div className="flex flex-col gap-3">
      <QuestionTitle
        label={field.label}
        onCommit={(label) => onCommit({ ...field, label })}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${field.key}-default`}>Antwort</Label>
        {field.type === 'single' ? (
          <select
            id={`${field.key}-default`}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={field.defaultValue ?? ''}
            onChange={(event) => patch({ defaultValue: event.target.value })}
          >
            <option value="">Keine</option>
            {(field.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : field.type === 'check' ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={field.defaultValue === 'ja'}
              onChange={(event) => patch({ defaultValue: event.target.checked ? 'ja' : '' })}
            />
            Bereits angekreuzt
          </label>
        ) : (
          <Input
            id={`${field.key}-default`}
            type={field.type === 'date' ? 'date' : 'text'}
            value={field.defaultValue ?? ''}
            onChange={(event) => patch({ defaultValue: event.target.value })}
          />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${field.key}-contract`}>Vertragsfeld</Label>
        <select
          id={`${field.key}-contract`}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={field.contractFieldKey ?? ''}
          onChange={(event) => patch({ contractFieldKey: event.target.value })}
        >
          <option value="">Keins</option>
          {contractFields.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
