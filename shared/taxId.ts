// ELSTER: Prüfung der Steuer- und Steueridentifikationsnummer, section 2.2.
export function taxIdInput(value: string) {
  return value.replace(/\s/g, "");
}

export function isValidTaxId(value: string) {
  const compact = taxIdInput(value);
  if (!/^[1-9]\d{10}$/.test(compact)) return false;
  const body = compact.slice(0, 10);
  const counts = Array<number>(10).fill(0);
  for (const digit of body) counts[Number(digit)] += 1;
  const repeated = counts.filter((count) => count > 1);
  if (repeated.length !== 1 || ![2, 3].includes(repeated[0])) return false;
  if (/(\d)\1\1/.test(body)) return false;

  let product = 10;
  for (const digit of body) {
    const sum = (Number(digit) + product) % 10 || 10;
    product = (2 * sum) % 11;
  }
  return Number(compact[10]) === (11 - product) % 10;
}
