const FACTORS = [2, 1, 2, 5, 7, 1, 2, 1, 2, 1, 2, 1];
const MONTH_LENGTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function insuranceNumberInput(value: string) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  let result = "";
  for (const char of compact) {
    if (result.length >= 12) break;
    const letterSlot = result.length === 8;
    if (letterSlot ? /[A-Z]/.test(char) : /\d/.test(char)) result += char;
  }
  return result;
}

function checkDigit(body: string) {
  const letter = body.charCodeAt(8) - 64;
  const digits = `${body.slice(0, 8)}${String(letter).padStart(2, "0")}${body.slice(9)}`;
  const sum = [...digits].reduce((total, char, index) => {
    const product = Number(char) * FACTORS[index];
    return total + Math.floor(product / 10) + (product % 10);
  }, 0);
  return String(sum % 10);
}

function realBirthDate(day: number, month: number) {
  return month >= 1 && month <= 12 && day >= 1 && day <= MONTH_LENGTH[month - 1];
}

export function isValidInsuranceNumber(value: string) {
  if (!/^\d{8}[A-Z]\d{3}$/.test(value)) return false;
  const day = Number(value.slice(2, 4));
  const month = Number(value.slice(4, 6));
  if (!realBirthDate(day, month)) return false;
  return value[11] === checkDigit(value.slice(0, 11));
}
