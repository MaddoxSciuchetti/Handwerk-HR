import { microsoftSimulationEnabled } from "@/constants/env";
import { loadMicrosoft365Config } from "@/services/integrations/runtime";
import {
    microsoftGraphFetch,
    SIMULATION_TOKEN,
} from "@/services/integrations/microsoftSimulation";

export async function organizationMailToken(organizationId: string) {
    const config = await loadMicrosoft365Config(organizationId);
    if (!config) return null;
    if (microsoftSimulationEnabled()) return SIMULATION_TOKEN;

    const response = await microsoftGraphFetch(
        `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
        {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                scope: "https://graph.microsoft.com/.default",
                grant_type: "client_credentials",
            }),
        },
    );
    if (!response.ok) {
        console.error("Microsoft mail token request failed", response.status);
        return null;
    }
    const payload = (await response.json()) as { access_token?: unknown };
    return typeof payload.access_token === "string" && payload.access_token
        ? payload.access_token
        : null;
}
