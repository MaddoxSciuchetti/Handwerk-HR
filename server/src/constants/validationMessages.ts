export const VALIDATION_MESSAGES = {
    required: (field: string) => `${field} is required.`,
    minLength: (field: string, min: number) =>
        `${field} must be at least ${min} characters long.`,
    maxLength: (field: string, max: number) =>
        `${field} must be ${max} characters or fewer.`,
    invalidEmail: "Please enter a valid email address.",
    valuesMustMatch: (left: string, right: string) =>
        `${left} and ${right} must match.`,
};
