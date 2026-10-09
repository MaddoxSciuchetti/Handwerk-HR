export const O365_BLOCK_SIGN_IN = 'o365-block-signin';

export const TEAM_DEPARTURE_MAIL = 'team-departure-mail';

export const ARBEITSZEUGNIS = 'arbeitszeugnis';

export const TASK_AUTOMATION_NONE = 'none';

export const TASK_AUTOMATION_OPTIONS = [
  { value: TASK_AUTOMATION_NONE, label: 'Keine' },
  { value: O365_BLOCK_SIGN_IN, label: 'O365 Zugang sperren' },
  { value: TEAM_DEPARTURE_MAIL, label: 'Infomail Entlassung' },
  { value: ARBEITSZEUGNIS, label: 'Arbeitszeugnis' },
] as const;

export type TaskAutomationValue =
  (typeof TASK_AUTOMATION_OPTIONS)[number]['value'];

export function storedTaskAutomation(
  value: string | null | undefined,
): TaskAutomationValue {
  const match = TASK_AUTOMATION_OPTIONS.find((option) => option.value === value);
  return match?.value ?? TASK_AUTOMATION_NONE;
}
