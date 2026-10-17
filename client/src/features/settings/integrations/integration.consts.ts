export const INTEGRATION_NONE = 'none';

export const INTEGRATION_PROVIDERS = [
  { value: 'microsoft_graph', label: 'Microsoft' },
  { value: 'crewmeister', label: 'Crewmeister' },
] as const;

export const INTEGRATION_SEQUENCES = [
  {
    value: 'microsoft_create_account',
    provider: 'microsoft_graph',
    label: 'Konto anlegen',
  },
  {
    value: 'microsoft_send_onboarding_email',
    provider: 'microsoft_graph',
    label: 'Onboarding-E-Mail senden',
  },
  {
    value: 'microsoft_send_offboarding_email',
    provider: 'microsoft_graph',
    label: 'Offboarding-E-Mail senden',
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
] as const;

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

export function sequenceLabel(sequence: string | null | undefined) {
  return (
    INTEGRATION_SEQUENCES.find((item) => item.value === sequence)?.label ??
    'Sequenz'
  );
}
