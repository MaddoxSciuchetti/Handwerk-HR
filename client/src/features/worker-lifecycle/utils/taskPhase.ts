// Team continues the onboarding side; offboarding history stays separate.
export function taskPhaseForType(type?: string) {
  return type === 'offboarding' ? 'offboarding' : 'onboarding';
}

export function engagementsForTaskPhase<T extends { type: string }>(
  engagements: T[],
  type: string | undefined = engagements[0]?.type
): T[] {
  const phase = taskPhaseForType(type);
  return engagements.filter(
    (engagement) => taskPhaseForType(engagement.type) === phase
  );
}
