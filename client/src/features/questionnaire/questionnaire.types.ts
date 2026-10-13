export type QuestionnaireQuestion = {
  key: string;
  label: string;
  section: string;
  type: 'text' | 'date' | 'single' | 'check';
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  layout?: 'inline';
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
