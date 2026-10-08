export type DocumentSegment =
  | { type: 'text'; text: string }
  | { type: 'input'; key: string; label: string };
