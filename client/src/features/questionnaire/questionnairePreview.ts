import { HOURS_DISTRIBUTION_KEY, isWeekdayHourKey } from '@shared/weeklyHours';
import type {
  QuestionnaireQuestion,
  QuestionnaireRepeater,
} from './questionnaire.types';

const PREVIEW_KEY = 'fragebogen-preview';

export type PreviewField = {
  kind: 'field';
  builtin?: boolean;
  key: string;
  label: string;
  section: string;
  type: QuestionnaireQuestion['type'];
  required?: boolean;
  options?: string[];
  max?: number;
  layout?: 'inline';
  defaultValue?: string;
  bsbOnly?: boolean;
};

export type PreviewRepeater = {
  kind: 'repeater';
  key: string;
  section: string;
  columns: QuestionnaireRepeater['columns'];
  allowMoreRows?: boolean;
};

export type PreviewItem = PreviewField | PreviewRepeater;

export type QuestionnairePreviewDraft = {
  name?: string;
  intro: string;
  items: PreviewItem[];
};

export type CandidateItem =
  | (QuestionnaireQuestion & { kind: 'field' })
  | (QuestionnaireRepeater & { kind: 'repeater' });

export function rememberQuestionnaireDraft(draft: QuestionnairePreviewDraft) {
  sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(draft));
}

export function readQuestionnaireDraft(): QuestionnairePreviewDraft | null {
  const raw = sessionStorage.getItem(PREVIEW_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as QuestionnairePreviewDraft;
    if (
      !parsed ||
      !Array.isArray(parsed.items) ||
      typeof parsed.intro !== 'string'
    )
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export function forgetQuestionnaireDraft() {
  sessionStorage.removeItem(PREVIEW_KEY);
}

export function candidateItems(items: PreviewItem[]): CandidateItem[] {
  return items.map((item) => {
    if (item.kind === 'repeater') {
      return {
        kind: 'repeater',
        key: item.key,
        section: item.section,
        afterSection: '',
        columns: item.columns,
        allowMoreRows: item.allowMoreRows,
      };
    }
    const preset = item.defaultValue?.trim() ?? '';
    return {
      kind: 'field',
      key: item.key,
      label: item.label,
      section: item.section,
      type: item.type,
      required: item.bsbOnly
        ? false
        : isWeekdayHourKey(item.key)
          ? false
          : item.key === HOURS_DISTRIBUTION_KEY
            ? item.required === true
            : item.type === 'file' || item.builtin === false
              ? item.required !== false
              : true,
      options: item.options,
      max: item.max,
      layout: item.layout,
      defaultValue: preset || undefined,
      employerFilled:
        item.bsbOnly === true || (!isWeekdayHourKey(item.key) && preset.length > 0),
      bsbOnly: item.bsbOnly,
    };
  });
}
