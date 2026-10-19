import { Input } from '@/components/ui/input';
import { insuranceNumberInput } from '@shared/insuranceNumber';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChoiceLineEditor } from '@/features/questionnaire/ChoiceLineEditor';
import { PflichtfeldSwitch } from './PflichtfeldSwitch';
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
    <div className="flex min-w-0 flex-col gap-3">
      <QuestionTitle
        label={field.label}
        onCommit={(label) => onCommit({ ...field, label })}
      />
      {field.type === 'file' ? (
        <PflichtfeldSwitch
          checked={field.required !== false}
          onChange={(required) => patch({ required })}
        />
      ) : (
        <QuestionAnswer field={field} onChange={patch} />
      )}
      {field.builtin === false && field.type !== 'file' ? (
        <PflichtfeldSwitch
          checked={field.required !== false}
          onChange={(required) => patch({ required })}
        />
      ) : null}
      {field.type === 'file' ? (
        <p className="text-xs text-muted-foreground">
          Die Datei wird beim Ausfüllen hochgeladen, zum Beispiel ein Führerschein.
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
      <PflichtfeldSwitch
        label="Nur vom Betrieb"
        checked={field.officeOnly === true}
        onChange={(checked) => patch({ officeOnly: checked || undefined })}
      />
      {field.type === 'file' ? null : (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${field.key}-contract`}>Vertragsfeld</Label>
          <Select
            value={field.contractFieldKey || '__none__'}
            onValueChange={(value) =>
              patch({ contractFieldKey: value === '__none__' ? '' : value })
            }
          >
            <SelectTrigger
              id={`${field.key}-contract`}
              className="h-9 w-full bg-background"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectItem value="__none__">Keins</SelectItem>
              {contractFields.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
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
                onChange({ defaultValue: field.defaultValue === option ? '' : option })
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
          onChange={(event) => onChange({ defaultValue: event.target.checked ? 'ja' : '' })}
        />
        Bereits angekreuzt
      </label>
    );
  }

  return (
    <Input
      id={`${field.key}-default`}
      type={field.type === 'date' ? 'date' : 'text'}
      value={field.defaultValue ?? ''}
      aria-label="Antwort"
      maxLength={field.key === 'insuranceNumber' ? 12 : field.max}
      onChange={(event) =>
        onChange({
          defaultValue:
            field.key === 'insuranceNumber'
              ? insuranceNumberInput(event.target.value)
              : event.target.value,
        })
      }
    />
  );
}
