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
  bsbOnly?: boolean;
  officeEditable?: boolean;
  builtin?: boolean;
  contractFieldKey?: string;
  max?: number;
  omitFromWorker?: boolean;
};

export type QuestionnaireRepeater = {
  key: string;
  section: string;
  afterSection: string;
  allowMoreRows?: boolean;
  omitFromWorker?: boolean;
  columns: {
    key: string;
    label: string;
    type: 'text' | 'date';
    officeOnly?: boolean;
  }[];
};
