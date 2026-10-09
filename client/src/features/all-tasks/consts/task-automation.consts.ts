export const O365_BLOCK_SIGN_IN = 'o365-block-signin';

export const TASK_AUTOMATION_NONE = 'none';

export const TASK_AUTOMATION_OPTIONS = [
  { value: TASK_AUTOMATION_NONE, label: 'Keine' },
  { value: O365_BLOCK_SIGN_IN, label: 'O365 Zugang sperren' },
] as const;

export type TaskAutomationValue =
  (typeof TASK_AUTOMATION_OPTIONS)[number]['value'];
