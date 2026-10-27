/** Mailbox on the domain saved in the Microsoft integration. */
export function mailboxOnConfiguredDomain(
    senderAddress: string | null | undefined,
    domain: string | null | undefined,
) {
    const host = configuredDomain(domain);
    const sender = senderAddress?.trim() ?? "";
    const at = sender.lastIndexOf("@");
    if (!host || at <= 0) return sender;
    const local = sender.slice(0, at);
    const current = sender.slice(at + 1).toLowerCase();
    if (!local || current === host) return sender;
    if (current === "onmicrosoft.com" || current.endsWith(".onmicrosoft.com")) {
        return `${local}@${host}`;
    }
    return sender;
}

function configuredDomain(domain: string | null | undefined) {
    const value = domain?.trim().replace(/^@+/, "").toLowerCase() ?? "";
    if (!value || value.includes("@") || value.includes("/") || /\s/.test(value)) {
        return "";
    }
    return value;
}
