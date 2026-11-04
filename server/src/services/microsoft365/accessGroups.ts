import { integrationsMocked, mockGroups } from "@/services/integrations/localMock";
import { MICROSOFT_APP_AUTH_ERROR } from "@/services/microsoft365/authError";
import { microsoftSimulationEnabled } from "@/constants/env";
import { microsoftGraphFetch } from "@/services/integrations/microsoftSimulation";
import {
    integrationsLive,
    loadMicrosoft365Config,
    NOT_LIVE_MESSAGE,
} from "@/services/integrations/runtime";
import { microsoftGraphToken } from "@/services/microsoft365Account";

const GRAPH = "https://graph.microsoft.com/v1.0";

export type MicrosoftAccessGroupOption = {
    id: string;
    displayName: string;
};

const GROUP_ID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeAccessGroupIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const entry of value) {
        if (typeof entry !== "string") continue;
        const id = entry.trim();
        if (!GROUP_ID.test(id)) continue;
        const key = id.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        ids.push(id);
    }
    return ids;
}

type GraphGroup = {
    id?: string;
    displayName?: string;
    securityEnabled?: boolean | null;
    mailEnabled?: boolean | null;
    groupTypes?: string[] | null;
    isAssignableToRole?: boolean | null;
};

type GraphList<T> = {
    value?: T[];
    "@odata.nextLink"?: string | null;
};

const GROUP_LOAD_ERROR =
    "Microsoft-Gruppen konnten nicht geladen werden. Bitte die Administration bitten, die Graph-Anwendungsberechtigung Group.Read.All und die Administratorzustimmung in Microsoft Entra zu prüfen.";

function isSystemGroup(name: string) {
    return (
        /^group for answers in viva engage(?:\s|$)/i.test(name) ||
        name.toLowerCase() === "aad dc administrators"
    );
}

export function isAccessGroup(group: GraphGroup) {
    if (group.isAssignableToRole === true) return false;
    const name = group.displayName?.trim() ?? "";
    if (!name || isSystemGroup(name)) return false;
    const types = group.groupTypes ?? [];
    const isUnified = types.some(
        (type) => type.trim().toLowerCase() === "unified",
    );
    return group.securityEnabled === true || isUnified;
}

async function listGraph<T>(token: string, path: string) {
    const items: T[] = [];
    let url: string | null = `${GRAPH}${path}`;
    const visited = new Set<string>();
    while (url) {
        if (visited.has(url)) return null;
        visited.add(url);
        const response = await microsoftGraphFetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            console.error("Microsoft Graph request failed", response.status);
            return null;
        }
        const list = (await response.json()) as GraphList<T>;
        items.push(...(list.value ?? []));
        url = list["@odata.nextLink"] ?? null;
    }
    return items;
}

export async function listMicrosoftAccessGroups(
    organizationId: string,
): Promise<
    | { groups: MicrosoftAccessGroupOption[]; error: null }
    | { groups: []; error: string }
> {
    if (integrationsMocked()) {
        return {
            groups: [
                ...mockGroups,
                { id: "mock-field", displayName: "Handwerk · Demo" },
                { id: "mock-office", displayName: "Büro · Demo" },
            ],
            error: null,
        };
    }
    if (!integrationsLive() && !microsoftSimulationEnabled()) {
        return { groups: [], error: NOT_LIVE_MESSAGE };
    }
    const config = await loadMicrosoft365Config(organizationId);
    if (!config) return { groups: [], error: null };
    let authError = MICROSOFT_APP_AUTH_ERROR;
    const token = await microsoftGraphToken(config, (message) => {
        authError = message;
    });
    if (!token) {
        return { groups: [], error: authError };
    }
    const groups = await listGraph<GraphGroup>(
        token,
        "/groups?$select=id,displayName,securityEnabled,mailEnabled,groupTypes,isAssignableToRole&$top=999",
    );
    if (!groups) {
        return { groups: [], error: GROUP_LOAD_ERROR };
    }
    return {
        groups: groups
            .filter(isAccessGroup)
            .map((group) => ({
                id: group.id?.trim() ?? "",
                displayName: group.displayName?.trim() ?? "",
            }))
            .filter((group) => group.id && group.displayName)
            .sort((left, right) =>
                left.displayName.localeCompare(right.displayName, "de"),
            ),
        error: null,
    };
}
