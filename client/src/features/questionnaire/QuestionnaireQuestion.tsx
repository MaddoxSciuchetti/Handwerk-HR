import { isValidTaxId, taxIdInput } from '@shared/taxId';
import { Input } from '@/components/ui/input';
import {
  insuranceNumberInput,
  isValidInsuranceNumber,
} from '@shared/insuranceNumber';
import { Label } from '@/components/ui/label';
import type { ReactNode } from 'react';
import { QuestionnaireFileInput } from './QuestionnaireFileInput';
import type { QuestionnaireQuestion as QuestionnaireQuestionData } from './questionnaire.types';

type QuestionnaireQuestionProps = {
  question: QuestionnaireQuestionData;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  employerFilled?: boolean;
  fillable?: boolean;
  labelControl?: ReactNode;
  uploadToken?: string;
  onUploadBusy?: (busy: boolean) => void;
};

function QuestionText({
  question,
  labelControl,
}: {
  question: QuestionnaireQuestionData;
  labelControl?: ReactNode;
}) {
  if (labelControl) return labelControl;
  return (
    <>
      {question.label}
      {question.required && !question.bsbOnly ? ' *' : ''}
    </>
  );
}

export function QuestionnaireQuestion({
  question,
  value,
  onChange,
  disabled = false,
  employerFilled = false,
  fillable = false,
  labelControl,
  uploadToken,
  onUploadBusy = () => undefined,
}: QuestionnaireQuestionProps) {
  const locked = fillable
    ? false
    : disabled || Boolean(question.bsbOnly && !question.officeEditable);
  const lockHint =
    !fillable &&
    (employerFilled || (question.bsbOnly && !question.officeEditable)) ? (
      <FieldLock bsbOnly={question.bsbOnly} />
    ) : null;
  const fieldClass = fillable
    ? 'bg-muted dark:bg-muted'
    : locked
      ? 'bg-muted text-muted-foreground'
      : undefined;
  if (question.type === 'file') {
    return (
      <div className="flex flex-col gap-2">
        <QuestionnaireFileInput
          question={question}
          value={value}
          token={uploadToken}
          disabled={locked}
          onChange={onChange}
          onBusy={onUploadBusy}
        />
        {lockHint}
      </div>
    );
  }
  if (question.type === 'single') {
    return (
      <fieldset
        className={
          fillable
            ? 'flex flex-col gap-2 rounded-xl bg-muted p-3'
            : 'flex flex-col gap-2'
        }
      >
        {question.label || labelControl ? (
          <legend className="text-sm font-medium">
            <QuestionText question={question} labelControl={labelControl} />
          </legend>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {(question.options ?? []).map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <input
                type="radio"
                name={question.key}
                className="size-4 accent-primary"
                checked={value === option}
                disabled={locked}
                onClick={() => {
                  if (locked || value !== option) return;
                  onChange('');
                }}
                onChange={() => onChange(option)}
              />
              {option}
            </label>
          ))}
        </div>
        {lockHint}
      </fieldset>
    );
  }

  if (question.type === 'check' && (question.options?.length ?? 0) > 1) {
    return (
      <fieldset
        className={
          fillable
            ? 'flex flex-col gap-2 rounded-xl bg-muted p-3'
            : 'flex flex-col gap-2'
        }
      >
        {question.label || labelControl ? (
          <legend className="text-sm font-medium">
            <QuestionText question={question} labelControl={labelControl} />
          </legend>
        ) : null}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {(question.options ?? []).map((option) => (
            <label
              key={option}
              className="flex items-start gap-2 text-sm text-foreground"
            >
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
                checked={value === option}
                disabled={locked}
                onChange={() => onChange(value === option ? '' : option)}
              />
              {option}
            </label>
          ))}
        </div>
        {lockHint}
      </fieldset>
    );
  }

  if (question.type === 'check') {
    return (
      <div
        className={
          fillable
            ? 'flex flex-col gap-2 rounded-xl bg-muted p-3'
            : 'flex flex-col gap-2'
        }
      >
        <label className="flex items-start gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-primary"
            checked={value === 'ja'}
            disabled={locked}
            onChange={(event) => onChange(event.target.checked ? 'ja' : '')}
          />
          <span>
            <QuestionText question={question} labelControl={labelControl} />
          </span>
        </label>
        {lockHint}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={question.key}>
        <QuestionText question={question} labelControl={labelControl} />
      </Label>
      <Input
        id={question.key}
        type={question.type === 'date' ? 'date' : 'text'}
        inputMode={question.key === 'taxId' ? 'numeric' : undefined}
        required={question.required && !locked}
        disabled={locked}
        value={value}
        maxLength={question.key === 'insuranceNumber' ? 12 : question.max}
        className={fieldClass}
        onChange={(event) =>
          onChange(
            question.key === 'insuranceNumber'
              ? insuranceNumberInput(event.target.value)
              : question.key === 'taxId'
                ? taxIdInput(event.target.value)
                : event.target.value
          )
        }
      />
      {question.key === 'taxId' && value && !isValidTaxId(value) ? (
        <p className="text-sm text-destructive" role="alert">
          Bitte eine gültige 11-stellige Steuer-ID eingeben.
        </p>
      ) : null}
      {question.key === 'insuranceNumber' &&
      value.length === 12 &&
      !isValidInsuranceNumber(value) ? (
        <p className="text-sm text-destructive">
          Die Versicherungsnummer hat nicht das richtige Format.
        </p>
      ) : null}
      {lockHint}
    </div>
  );
}

function FieldLock({ bsbOnly }: { bsbOnly?: boolean }) {
  return (
    <p className="text-xs text-muted-foreground">
      {bsbOnly ? 'Nur von BSB auszufüllen' : 'Vom Betrieb ausgefüllt'}
    </p>
  );
}
