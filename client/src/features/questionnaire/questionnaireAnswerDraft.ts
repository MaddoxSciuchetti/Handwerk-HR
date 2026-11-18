export type QuestionnaireAnswerDraft = {
  values: Record<string, string>;
  rows: Record<string, Record<string, string>[]>;
};

function storageKey(token: string) {
  return `fragebogen-answers:v1:${token}`;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value as Record<string, unknown>).every(
      (entry) => typeof entry === 'string'
    )
  );
}

function isRowList(value: unknown): value is Record<string, string>[] {
  return Array.isArray(value) && value.every(isStringRecord);
}

function parseDraft(raw: string): QuestionnaireAnswerDraft | null {
  try {
    const parsed = JSON.parse(raw) as Partial<QuestionnaireAnswerDraft>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!isStringRecord(parsed.values)) return null;
    if (
      !parsed.rows ||
      typeof parsed.rows !== 'object' ||
      Array.isArray(parsed.rows)
    )
      return null;
    const rows: Record<string, Record<string, string>[]> = {};
    for (const [key, value] of Object.entries(parsed.rows)) {
      if (!isRowList(value)) return null;
      rows[key] = value;
    }
    return { values: parsed.values, rows };
  } catch {
    return null;
  }
}

export function readAnswerDraft(token: string): QuestionnaireAnswerDraft | null {
  if (!token) return null;
  try {
    const raw = localStorage.getItem(storageKey(token));
    if (raw === null) return null;
    return parseDraft(raw);
  } catch {
    return null;
  }
}

export function writeAnswerDraft(
  token: string,
  draft: QuestionnaireAnswerDraft
) {
  if (!token) return;
  try {
    localStorage.setItem(storageKey(token), JSON.stringify(draft));
  } catch {
    // Form stays usable when the browser blocks persistent storage.
  }
}

export function clearAnswerDraft(token: string) {
  if (!token) return;
  try {
    localStorage.removeItem(storageKey(token));
  } catch {
    // Ignore storage failures on clear.
  }
}
