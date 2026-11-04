const PHONE_MAX = 32;
const DIGIT_MIN = 6;
const DIGIT_MAX = 15;

/** Keep typing usable: digits, spaces, and common phone punctuation. */
export function phoneNumberInput(value: string) {
  return value.replace(/[^\d+\s\-()/]/g, "").slice(0, PHONE_MAX);
}

export function parseWorkerPhoneNumber(
  raw: string,
): { ok: true; value: string | null } | { ok: false; message: string } {
  const value = raw.trim();
  if (!value) return { ok: true, value: null };
  if (value.length > PHONE_MAX) {
    return { ok: false, message: `Maximal ${PHONE_MAX} Zeichen` };
  }
  if (!/^\+?[0-9\s\-()/]+$/.test(value)) {
    return { ok: false, message: "Ungültige Telefonnummer" };
  }
  if (value.includes("+") && !value.startsWith("+")) {
    return { ok: false, message: "Ungültige Telefonnummer" };
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length < DIGIT_MIN || digits.length > DIGIT_MAX) {
    return { ok: false, message: "Ungültige Telefonnummer" };
  }
  return { ok: true, value };
}

export function isValidWorkerPhoneNumber(raw: string) {
  return parseWorkerPhoneNumber(raw).ok;
}
