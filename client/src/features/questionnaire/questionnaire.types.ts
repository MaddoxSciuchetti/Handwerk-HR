export type QuestionnaireQuestion = {
  key: string;
  label: string;
  section: string;
  type: 'text' | 'date' | 'single' | 'check' | 'file';
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  layout?: 'inline';
  employerFilled?: boolean;
  officeEditable?: boolean;
  builtin?: boolean;
  contractFieldKey?: string;
  builtin?: boolean;
  max?: number;
};

export type QuestionnaireRepeater = {
  key: string;
  section: string;
  afterSection: string;
  columns: {
    key: string;
    label: string;
    type: 'text' | 'date';
  }[];
};
