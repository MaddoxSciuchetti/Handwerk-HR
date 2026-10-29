import { apiJson } from '@/config/apiClient';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import type { QuestionnaireQuestion as QuestionnaireQuestionData } from './questionnaire.types';

type QuestionnaireFileInputProps = {
  question: QuestionnaireQuestionData;
  value: string;
  token?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBusy: (busy: boolean) => void;
};

function storedName(value: string) {
  try {
    const parsed = JSON.parse(value) as { name?: unknown };
    return typeof parsed.name === 'string' ? parsed.name : '';
  } catch {
    return '';
  }
}

export function QuestionnaireFileInput({
  question,
  value,
  token,
  disabled = false,
  onChange,
  onBusy,
}: QuestionnaireFileInputProps) {
  const [error, setError] = useState('');
  const name = storedName(value);
  const upload = async (file: File | undefined) => {
    if (!file || !token) {
      onChange('');
      return;
    }
    const body = new FormData();
    body.append('file', file);
    onBusy(true);
    setError('');
    try {
      const result = await apiJson.post<{
        success: boolean;
        data: { value: string };
      }>(`fragebogen/${token}/file`, body);
      onChange(result.data.value);
    } catch {
      onChange('');
      setError('Die Datei konnte nicht hochgeladen werden.');
    } finally {
      onBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={question.key}>
        {question.label}
        {question.required && !question.bsbOnly ? ' *' : ''}
      </Label>
      <input
        id={question.key}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        disabled={disabled || !token}
        aria-label={question.label}
        className="w-full min-w-0 text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5"
        onChange={(event) => {
          void upload(event.target.files?.[0]);
        }}
      />
      {name ? <p className="text-sm break-all">{name}</p> : null}
      {!token ? (
        <p className="text-xs text-muted-foreground">
          Die Datei wird beim Ausfüllen hochgeladen.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
