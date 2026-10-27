const ADDRESS_PROPERTIES = [
    "userprincipalname",
    "mailnickname",
    "proxyaddresses",
];

function errorText(value: unknown): string {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    if (Array.isArray(value)) return value.map(errorText).join(" ");
    const record = value as Record<string, unknown>;
    return [record.code, record.message, record.value, record.target, record.details, record.error]
        .map(errorText)
        .join(" ");
}

/** Graph reports a taken sign-in address as HTTP 400, not only as 409. */
export function isMicrosoftAddressConflict(status: number, payload: unknown) {
    if (status === 409) return true;
    if (status !== 400) return false;
    const text = errorText(payload).toLowerCase();
    const mentionsAddress = ADDRESS_PROPERTIES.some((property) =>
        text.includes(property),
    );
    const conflict =
        text.includes("already exists") ||
        text.includes("bereits vorhanden") ||
        text.includes("objectconflict") ||
        text.includes("samekeyvalue");
    return mentionsAddress && conflict;
}
