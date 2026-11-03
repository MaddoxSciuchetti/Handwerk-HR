export const INTEGRATION_NONE = 'none';

export const INTEGRATION_PROVIDERS = [
  { value: 'microsoft_graph', label: 'Microsoft' },
  { value: 'crewmeister', label: 'Crewmeister' },
] as const;

export const INTEGRATION_SEQUENCES = [
  {
    value: 'microsoft_send_teams_message',
    provider: 'microsoft_graph',
    label: 'Teams-Nachricht senden',
  },
  {
    value: 'microsoft_create_account',
    provider: 'microsoft_graph',
    label: 'Konto anlegen',
  },
  {
    value: 'microsoft_send_email',
    provider: 'microsoft_graph',
    label: 'E-Mail senden',
  },
  {
    value: 'microsoft_deactivate_account',
    provider: 'microsoft_graph',
    label: 'Konto deaktivieren',
  },
  {
    value: 'crewmeister_create_account',
    provider: 'crewmeister',
    label: 'Konto anlegen',
  },
  {
    value: 'crewmeister_deactivate_account',
    provider: 'crewmeister',
    label: 'Konto deaktivieren',
  },
  {
    value: 'crewmeister_delete_membership',
    provider: 'crewmeister',
    label: 'Mitgliedschaft entfernen',
  },
] as const;

export const crewmeisterRemovalWarning =
  'Entfernt die deaktivierte Crewmeister-Mitgliedschaft dauerhaft, auch bei einer noch offenen Einladung. Der globale Crewmeister-Login bleibt bestehen. Nur ausführen, wenn diese Mitgliedschaft wirklich entfernt werden soll.';

export type IntegrationProviderValue =
  (typeof INTEGRATION_PROVIDERS)[number]['value'];

export type IntegrationSequenceValue =
  (typeof INTEGRATION_SEQUENCES)[number]['value'];

export function integrationLabel(provider: string | null | undefined) {
  return (
    INTEGRATION_PROVIDERS.find((item) => item.value === provider)?.label ??
    'Integration'
  );
}

export function isMailSequence(sequence: string | null | undefined) {
  return (
    sequence === 'microsoft_send_email' ||
    sequence === 'microsoft_send_onboarding_email' ||
    sequence === 'microsoft_send_offboarding_email'
  );
}

export function sequenceLabel(sequence: string | null | undefined) {
  if (isMailSequence(sequence)) return 'E-Mail senden';
  return (
    INTEGRATION_SEQUENCES.find((item) => item.value === sequence)?.label ??
    'Sequenz'
  );
}
