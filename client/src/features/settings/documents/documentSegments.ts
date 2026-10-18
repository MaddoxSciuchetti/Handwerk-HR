export type DocumentSegment =
  | { type: 'text'; text: string }
  | {
      type: 'input';
      key: string;
      label: string;
      fieldType?: 'text' | 'date' | 'checkbox' | 'points';
      required?: boolean;
      dateMode?: 'today' | null;
    };
