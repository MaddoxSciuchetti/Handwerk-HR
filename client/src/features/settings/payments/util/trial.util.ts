const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Full days left until `trialEndsAt` (UTC instant). `0` = last day or expired. `null` if no date. */
export function trialDaysRemaining(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / MS_PER_DAY);
}

export function trialDaysRemainingLabel(
  trialEndsAt: string | null
): string | null {
  const days = trialDaysRemaining(trialEndsAt);
  if (days === null) return null;
  if (days === 0) return 'Letzter Tag der Testphase — bitte wähle einen Plan.';
  if (days === 1) return 'Noch 1 Tag in der Testphase.';
  return `Noch ${days} Tage in der Testphase.`;
}
