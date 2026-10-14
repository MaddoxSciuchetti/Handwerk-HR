import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChoiceLineEditor } from '@/features/questionnaire/ChoiceLineEditor';
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
        <Label>Antwort</Label>
        {field.type === 'single' ? (
          <div className="flex flex-col gap-2">
            {(field.options ?? []).map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`${field.key}-default`}
                  className="size-4 accent-primary"
                  checked={field.defaultValue === option}
                  onClick={(event) => {
                    if (field.defaultValue !== option) return;
                    event.preventDefault();
                    patch({ defaultValue: '' });
                  }}
                  onChange={() => patch({ defaultValue: option })}
                />
                {option}
              </label>
            ))}
          </div>
        ) : field.type === 'check' && (field.options?.length ?? 0) > 1 ? (
          <div className="flex flex-col gap-2">
            {(field.options ?? []).map((option) => (
              <label key={option} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                  checked={field.defaultValue === option}
                  onChange={() =>
                    patch({ defaultValue: field.defaultValue === option ? '' : option })
                  }
                />
                {option}
              </label>
            ))}
          </div>
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
      {field.type === 'check' && !field.builtin ? (
        <ChoiceLineEditor
          options={field.options ?? []}
          onChange={(options) =>
            patch({
              options,
              defaultValue: options.includes(field.defaultValue ?? '')
                ? field.defaultValue
                : '',
            })
          }
        />
      ) : null}
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
