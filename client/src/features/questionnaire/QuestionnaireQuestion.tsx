import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReactNode } from 'react';
import type { QuestionnaireQuestion as QuestionnaireQuestionData } from './questionnaire.types';

type QuestionnaireQuestionProps = {
  question: QuestionnaireQuestionData;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  employerFilled?: boolean;
  labelControl?: ReactNode;
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
      {question.required ? ' *' : ''}
    </>
  );
}

export function QuestionnaireQuestion({
  question,
  value,
  onChange,
  disabled = false,
  employerFilled = false,
  labelControl,
}: QuestionnaireQuestionProps) {
  const locked = disabled;
  if (question.type === 'single') {
    return (
      <fieldset className="flex flex-col gap-2">
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
                onChange={() => onChange(option)}
              />
              {option}
            </label>
          ))}
        </div>
        {employerFilled ? <FieldLock /> : null}
      </fieldset>
    );
  }

  if (question.type === 'check') {
    return (
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
        required={question.required && !locked}
        disabled={locked}
        value={value}
        className={locked ? 'bg-muted text-muted-foreground' : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {employerFilled ? <FieldLock /> : null}
    </div>
  );
}

function FieldLock() {
  return <p className="text-xs text-muted-foreground">Vom Betrieb ausgefüllt</p>;
}
