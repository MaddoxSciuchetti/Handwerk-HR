import type { EngagementTemplateTypeV2 } from '../api/templateV2.api';

export type TemplateTab = 'ONBOARDING' | 'OFFBOARDING';

export function engagementTypeFromTab(
  tab: TemplateTab
): Exclude<EngagementTemplateTypeV2, 'transfer'> {
  return tab === 'ONBOARDING' ? 'onboarding' : 'offboarding';
}
