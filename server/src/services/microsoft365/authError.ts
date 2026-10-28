const ADMIN_ACTION =
    "Bitte die Administration bitten, unter Einstellungen → Integrationen die Microsoft-365-App zu prüfen. Eine erneute persönliche Microsoft-Anmeldung behebt diesen Fehler nicht.";

export const MICROSOFT_APP_AUTH_ERROR =
    "Microsoft hat die Anmeldung der Organisation abgelehnt. Die genaue Ursache wurde nicht gemeldet. Bitte unter Einstellungen → Integrationen Mandanten-ID, Client-ID und Client-Secret prüfen und korrigieren oder die Administration darum bitten.";

// Only expose known error categories; Microsoft's raw response can contain tenant details.
export function microsoftAppAuthError(payload: unknown, status: number): string {
    const data = payload && typeof payload === "object"
        ? payload as { error?: unknown; error_codes?: unknown }
        : {};
    const codes = Array.isArray(data.error_codes) ? data.error_codes.map(Number) : [];
    let issue: string;
    if (codes.includes(7000222)) {
        issue = "Das Client-Secret der Microsoft-365-App ist abgelaufen. Bitte ein neues Secret in Microsoft Entra erstellen und in der Integration hinterlegen.";
    } else if (codes.includes(7000215) || codes.includes(7000218)) {
        issue = "Das Client-Secret der Microsoft-365-App ist ungültig oder fehlt. Bitte den Secret-Wert (nicht die Secret-ID) in der Integration korrigieren.";
    } else if (codes.includes(700016)) {
        issue = "Die Microsoft-365-App wurde im angegebenen Mandanten nicht gefunden. Bitte Client-ID und Mandanten-ID der Organisation prüfen.";
    } else if (codes.includes(90002)) {
        issue = "Der Microsoft-365-Mandant wurde nicht gefunden. Bitte die Mandanten-ID der Organisation korrigieren.";
    } else if (codes.includes(65001) || codes.includes(65004) || data.error === "consent_required") {
        issue = "Die Administratorzustimmung für die Microsoft-365-App fehlt oder wurde abgelehnt. Bitte die erforderlichen Anwendungsberechtigungen in Microsoft Entra freigeben.";
    } else if (status === 429 || status >= 500 || data.error === "temporarily_unavailable" || data.error === "server_error") {
        return "Der Microsoft-Anmeldedienst ist vorübergehend nicht verfügbar. Bitte in wenigen Minuten erneut versuchen.";
    } else if (data.error === "invalid_client") {
        issue = "Microsoft hat die App-Zugangsdaten der Organisation abgelehnt. Bitte Client-ID, Mandanten-ID und Client-Secret prüfen.";
    } else {
        return MICROSOFT_APP_AUTH_ERROR;
    }
    return `${issue} ${ADMIN_ACTION}`;
}
