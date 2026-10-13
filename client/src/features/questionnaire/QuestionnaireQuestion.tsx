import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { QuestionnaireQuestion as QuestionnaireQuestionData } from './questionnaire.types';

type QuestionnaireQuestionProps = {
  question: QuestionnaireQuestionData;
  value: string;
  onChange: (value: string) => void;
};

export function QuestionnaireQuestion({
  question,
  value,
  onChange,
}: QuestionnaireQuestionProps) {
  if (question.type === 'single') {
    return (
      <fieldset className="flex flex-col gap-2">
        {question.label ? (
          <legend className="text-sm font-medium">
            {question.label}
            {question.required ? ' *' : ''}
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
                onChange={() => onChange(option)}
              />
              {option}
            </label>
          ))}
        </div>
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
          onChange={(event) => onChange(event.target.checked ? 'ja' : '')}
        />
        <span>
          {question.label}
          {question.required ? ' *' : ''}
        </span>
      </label>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={question.key}>
        {question.label}
        {question.required ? ' *' : ''}
      </Label>
      <Input
        id={question.key}
        type={question.type === 'date' ? 'date' : 'text'}
        required={question.required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
