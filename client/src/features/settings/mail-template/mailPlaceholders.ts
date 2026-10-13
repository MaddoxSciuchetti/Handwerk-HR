export const MAIL_PLACEHOLDER_DRAG = 'application/x-handwerk-mail-placeholder';

export const welcomeMailPlaceholders = [
  'Vorname',
  'Nachname',
  'Arbeitsmail',
  'Position',
  'Eintritt',
] as const;

export const departureMailPlaceholders = [
  'Vorname',
  'Nachname',
  'Arbeitsmail',
  'Position',
  'Entlassung',
] as const;

export const mailPillClassName =
  'inline-flex h-6 items-center rounded-full border border-border bg-card px-2.5 align-baseline text-xs font-medium text-foreground';
