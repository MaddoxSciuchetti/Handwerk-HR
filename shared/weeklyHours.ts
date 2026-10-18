export const WEEKLY_HOURS_SECTION =
  "Ggf.Verteilung d. wöchentl. Arbeitszeit (Std.)";

export const HOURS_DISTRIBUTION_KEY = "hoursDistribution";

export const WEEKLY_HOURS_PROMPT =
  "Soll die Arbeitszeit auf bestimmte Wochentage verteilt werden?";

export const WEEKDAYS = [
  { key: "hoursMonday", label: "Mo", aliases: ["montag", "monday", "mo"] },
  { key: "hoursTuesday", label: "Di", aliases: ["dienstag", "tuesday", "di"] },
  { key: "hoursWednesday", label: "Mi", aliases: ["mittwoch", "wednesday", "mi"] },
  { key: "hoursThursday", label: "Do", aliases: ["donnerstag", "thursday", "do"] },
  { key: "hoursFriday", label: "Fr", aliases: ["freitag", "friday", "fr"] },
  { key: "hoursSaturday", label: "Sa", aliases: ["samstag", "saturday", "sa"] },
  { key: "hoursSunday", label: "So", aliases: ["sonntag", "sunday", "so"] },
] as const;

export const WEEKDAY_HOUR_KEYS = WEEKDAYS.map((day) => day.key);

const weekdayKeySet = new Set<string>(WEEKDAY_HOUR_KEYS);

export function isWeekdayHourKey(key: string) {
  return weekdayKeySet.has(key);
}

export function isWeeklyHoursKey(key: string) {
  return key === HOURS_DISTRIBUTION_KEY || isWeekdayHourKey(key);
}

/** Blank is unspecified. A trailing comma is kept so 7,5 can be typed. */
export function hourInput(value: string) {
  const cleaned = value.replace(".", ",").replace(/[^\d,]/g, "");
  const comma = cleaned.indexOf(",");
  const whole = (comma === -1 ? cleaned : cleaned.slice(0, comma)).slice(0, 2);
  if (comma === -1) return whole;
  const fraction = cleaned
    .slice(comma + 1)
    .replace(/,/g, "")
    .slice(0, 2);
  return `${whole},${fraction}`;
}

/** Undefined when blank, null when the text is not a number of hours up to `max`. */
export function normalizeHour(value: string, max = 24): string | undefined | null {
  const trimmed = value.trim().replace(".", ",").replace(/,$/, "");
  if (!trimmed) return undefined;
  const match = /^(\d{1,3})(?:,(\d{1,2}))?$/.exec(trimmed);
  if (!match) return null;
  const quantity = Number(`${match[1]}.${match[2] ?? "0"}`);
  if (!Number.isFinite(quantity) || quantity > max) return null;
  const fraction = (match[2] ?? "").replace(/0+$/, "");
  const whole = String(Number(match[1]));
  return fraction ? `${whole},${fraction}` : whole;
}

export function hourQuantity(value: string, max = 24) {
  const normalized = normalizeHour(value, max);
  if (!normalized) return null;
  return Number(normalized.replace(",", "."));
}

export function formatHours(value: number) {
  return value.toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

export function weekdayHoursTotal(values: Record<string, string | undefined>) {
  return WEEKDAYS.reduce((sum, day) => sum + (hourQuantity(values[day.key] ?? "") ?? 0), 0);
}

function weekdayAliasMatches(blob: string, alias: string) {
  if (blob === alias) return true;
  if (!blob.endsWith(alias)) return false;
  if (alias.length > 2) return true;
  return blob.startsWith("arbeitszeit") || blob.includes("stunden");
}

function fold(value: string) {
  return value
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

const WEEKLY_TOTAL = /wochenstunden|wochenarbeitszeit|wochentlichearbeitszeit|arbeitszeitprowoche/;

export function weeklyHoursReference(
  questions: { key: string; label: string }[],
  values: Record<string, string | undefined>,
) {
  for (const question of questions) {
    if (isWeeklyHoursKey(question.key)) continue;
    if (!WEEKLY_TOTAL.test(fold(question.label))) continue;
    const hours = hourQuantity(values[question.key] ?? "", 168);
    if (hours == null) continue;
    return { label: question.label, hours };
  }
  return null;
}

export function suggestWeekdayLinks(fields: { key: string; label: string }[]) {
  const used = new Set<string>();
  const links: Partial<Record<(typeof WEEKDAYS)[number]["key"], string>> = {};
  for (const day of WEEKDAYS) {
    let best: { key: string; score: number } | null = null;
    for (const field of fields) {
      if (used.has(field.key)) continue;
      const blobs = [fold(field.label), fold(field.key)];
      const aliases = [...day.aliases].sort((left, right) => right.length - left.length);
      for (const alias of aliases) {
        if (blobs.some((blob) => weekdayAliasMatches(blob, alias))) {
          if (!best || alias.length > best.score) best = { key: field.key, score: alias.length };
          break;
        }
      }
    }
    if (!best) continue;
    used.add(best.key);
    links[day.key] = best.key;
  }
  return links;
}

export function clearUndistributedWeekdays<T extends Record<string, unknown>>(
  fields: { key: string; officeOnly?: boolean }[],
  answers: T,
): T {
  if (fields.some((field) => isWeekdayHourKey(field.key) && field.officeOnly)) return answers;
  if (!fields.some((field) => field.key === HOURS_DISTRIBUTION_KEY)) return answers;
  const choice = answers[HOURS_DISTRIBUTION_KEY];
  if (typeof choice === "string" && choice.trim().toLowerCase() === "ja") return answers;
  const next = { ...answers };
  for (const key of WEEKDAY_HOUR_KEYS) {
    (next as Record<string, unknown>)[key] = "";
  }
  return next;
}
