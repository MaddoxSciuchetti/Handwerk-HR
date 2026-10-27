import { taxIdInput } from '@shared/taxId';

import { Input } from '@/components/ui/input';
import { insuranceNumberInput } from '@shared/insuranceNumber';
import { ChoiceLineEditor } from '@/features/questionnaire/ChoiceLineEditor';
import { PflichtfeldSwitch } from './PflichtfeldSwitch';
import { QuestionTitle } from './QuestionTitle';
import type {
  ContractFieldOption,
  TemplateField,
} from './questionnaireTemplate.types';

type QuestionnaireFieldControlsProps = {
  field: TemplateField;
  contractFields: ContractFieldOption[];
  onChange: (field: TemplateField) => void;
  onCommit: (field: TemplateField) => void;
};

export function QuestionnaireFieldControls({
  field,
  onChange,
  onCommit,
}: QuestionnaireFieldControlsProps) {
  const patch = (next: Partial<TemplateField>) =>
    onChange({ ...field, ...next });

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <QuestionTitle
        label={field.label}
        onChange={(label) => patch({ label })}
        onCommit={(label) => onCommit({ ...field, label })}
      />
      {field.type !== 'file' ? (
        <div className="flex min-w-0 items-start gap-2">
          <span className="w-16 shrink-0 pt-1 text-sm leading-6 font-medium">
            Antwort:
          </span>
          <div className="min-w-0 flex-1">
            <QuestionAnswer field={field} onChange={patch} />
          </div>
        </div>
      ) : null}
      {field.type === 'file' ? (
        <p className="text-xs text-muted-foreground">
          Die Datei wird beim Ausfüllen hochgeladen, zum Beispiel ein
          Führerschein.
        </p>
      ) : null}
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {field.type === 'file' || field.builtin === false ? (
          <PflichtfeldSwitch
            checked={field.required !== false}
            onChange={(required) => patch({ required })}
          />
        ) : null}
        <PflichtfeldSwitch
          label="Nur vom Betrieb"
          checked={field.officeOnly ?? field.bsbOnly ?? false}
          onChange={(checked) =>
            patch({ officeOnly: checked || undefined, bsbOnly: undefined })
          }
        />
      </div>
    </div>
  );
}

function QuestionAnswer({
  field,
  onChange,
}: {
  field: TemplateField;
  onChange: (next: Partial<TemplateField>) => void;
}) {
  if (field.type === 'single') {
    return (
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
                onChange({ defaultValue: '' });
              }}
              onChange={() => onChange({ defaultValue: option })}
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (field.type === 'check' && (field.options?.length ?? 0) > 1) {
    return (
      <div className="flex flex-col gap-2">
        {(field.options ?? []).map((option) => (
          <label key={option} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-primary"
              checked={field.defaultValue === option}
              onChange={() =>
                onChange({
                  defaultValue: field.defaultValue === option ? '' : option,
                })
              }
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (field.type === 'check') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={field.defaultValue === 'ja'}
          onChange={(event) =>
            onChange({ defaultValue: event.target.checked ? 'ja' : '' })
          }
        />
        Bereits angekreuzt
      </label>
    );
  }

  return (
    <Input
      id={`${field.key}-default`}
      className="h-8 min-w-0 focus-visible:border-input focus-visible:ring-0"
      type={field.type === 'date' ? 'date' : 'text'}
      value={field.defaultValue ?? ''}
      aria-label="Antwort"
      maxLength={field.key === 'insuranceNumber' ? 12 : field.max}
      onChange={(event) =>
        onChange({
          defaultValue:
            field.key === 'insuranceNumber'
              ? insuranceNumberInput(event.target.value)
              : field.key === 'taxId'
                ? taxIdInput(event.target.value)
                : event.target.value,
        })
      }
    />
  );
}
