// Team has no tasks; onboarding and offboarding histories stay separate.
export function taskPhaseForType(type?: string) {
  if (type === 'transfer' || type === 'team') return 'team';
  return type === 'offboarding' ? 'offboarding' : 'onboarding';
}

export function engagementsForTaskPhase<T extends { type: string }>(
  engagements: T[],
  type: string | undefined = engagements[0]?.type
): T[] {
  const phase = taskPhaseForType(type);
  if (phase === 'team') return [];
  return engagements.filter(
    (engagement) => taskPhaseForType(engagement.type) === phase
  );
}
