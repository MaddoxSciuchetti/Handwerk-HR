export const VALIDATION_MESSAGES = {
  required: (field: string) => `${field} ist erforderlich`,
  minLength: (field: string, min: number) =>
    `${field} muss mindestens ${min} Zeichen lang sein`,
  invalidEmail: 'Bitte gib eine gültige E-Mail-Adresse ein',
  valuesMustMatch: (left: string, right: string) =>
    `${left} und ${right} müssen übereinstimmen`,
  optionRequired: 'Bitte wähle eine Option aus',
};
