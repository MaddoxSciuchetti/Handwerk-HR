export type TemplateField = {
  kind: 'field';
  key: string;
  label: string;
  section: string;
  type: 'text' | 'date' | 'single' | 'check' | 'file';
  required?: boolean;
  options?: string[];
  max?: number;
  layout?: 'inline';
  employerFilled?: boolean;
  defaultValue?: string;
  builtin?: boolean;
  contractFieldKey?: string;
};

export type TemplateRepeater = {
  kind: 'repeater';
  key: 'children' | 'priorEmployment';
  section: string;
  columns: { key: string; label: string; type: 'text' | 'date' }[];
};

export type TemplateItem = TemplateField | TemplateRepeater;

export type ContractFieldOption = {
  key: string;
  label: string;
};

export type QuestionnaireTemplatePage = {
  name?: string;
  intro: string;
  items: TemplateItem[];
  catalog: TemplateItem[];
  contractFields: ContractFieldOption[];
};

export const HOUR_KEYS = [
  'hoursMonday',
  'hoursTuesday',
  'hoursWednesday',
  'hoursThursday',
  'hoursFriday',
  'hoursSaturday',
  'hoursSunday',
] as const;

export const QUESTION_DRAG_TYPE = 'application/x-fragebogen-item';
