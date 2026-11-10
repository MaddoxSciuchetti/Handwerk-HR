const SENSITIVE_KEY_PATTERN =
    /(password|passwd|secret|token|authorization|cookie|api[_-]?key|access[_-]?token|refresh[_-]?token|stripe-signature)/i;

const REDACTED = "[Redacted]";

/** Replace values for known secret-like keys. Does not log request bodies. */
export function redactFields(
    fields: Record<string, unknown>,
): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
            result[key] = REDACTED;
            continue;
        }
        if (value && typeof value === "object" && !Array.isArray(value)) {
            result[key] = redactFields(value as Record<string, unknown>);
            continue;
        }
        result[key] = value;
    }
    return result;
}
