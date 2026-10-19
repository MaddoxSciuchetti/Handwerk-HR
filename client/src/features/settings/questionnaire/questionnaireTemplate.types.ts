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
  officeOnly?: boolean;
};

export type TemplateRepeater = {
  kind: 'repeater';
  key: string;
  section: string;
  columns: { key: string; label: string; type: 'text' | 'date'; officeOnly?: boolean }[];
  allowMoreRows?: boolean;
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

export { WEEKDAY_HOUR_KEYS as HOUR_KEYS } from '@shared/weeklyHours';

export const QUESTION_DRAG_TYPE = 'application/x-fragebogen-item';
