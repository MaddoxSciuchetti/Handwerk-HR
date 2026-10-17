export function fileBoxTitle(name: string, fallback: string) {
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  if (/^[0-9a-f-]{8,}$/i.test(trimmed) || /^\d{8,}/.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}
