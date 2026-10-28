import { isMicrosoftAddressConflict } from "./addressConflict";
import { buildUserPrincipalName } from "./identity";
import type {
    AssignLicenseInput,
    CreateGraphUserInput,
    GraphUser,
    Microsoft365Config,
    Microsoft365GraphClient,
} from "./types";

const GRAPH = "https://graph.microsoft.com/v1.0";
const TOKEN_SCOPE = "https://graph.microsoft.com/.default";
const MAX_ADDRESS_ATTEMPTS = 20;

export function createMicrosoft365GraphClient(
    fetcher: typeof fetch = (input, init) => fetch(input, init),
): Microsoft365GraphClient {
    async function readBody(response: Response) {
        const text = await response.text();
        if (!text) return null;
        try {
            return JSON.parse(text) as unknown;
        } catch {
            return text;
        }
    }

    async function getToken(config: Microsoft365Config | null) {
        if (!config) return null;
        return graphToken(config);
    }

    async function graphToken(config: Microsoft365Config) {
        const body = new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            scope: TOKEN_SCOPE,
            grant_type: "client_credentials",
        });
        const response = await fetcher(
            `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body,
            },
        );
        const payload = await readBody(response);
        const token =
            payload &&
            typeof payload === "object" &&
            "access_token" in payload &&
            typeof payload.access_token === "string"
                ? payload.access_token
                : "";
        if (!response.ok || !token) {
            console.error(
                "Microsoft 365 token request failed",
                response.status,
            );
            return null;
        }
        return token;
    }

    async function graphRequest(
        token: string,
        path: string,
        init?: RequestInit,
    ) {
        const response = await fetcher(`${GRAPH}${path}`, {
            ...init,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                ...(init?.headers ?? {}),
            },
        });
        const payload = await readBody(response);
        return { response, payload };
    }

    async function createGraphUser(params: CreateGraphUserInput) {
        for (let attempt = 1; attempt <= MAX_ADDRESS_ATTEMPTS; attempt += 1) {
            const userPrincipalName = buildUserPrincipalName({
                firstName: params.firstName,
                lastName: params.lastName,
                domain: params.config.domain,
                attempt,
            });
            const mailNickname = userPrincipalName.split("@")[0].slice(0, 64);
            const { response, payload } = await graphRequest(
                params.token,
                "/users",
                {
                    method: "POST",
                    body: JSON.stringify({
                        accountEnabled: true,
                        displayName:
                            `${params.firstName.trim()} ${params.lastName.trim()}`.trim(),
                        mailNickname,
                        userPrincipalName,
                        usageLocation: "DE",
                        passwordProfile: {
                            forceChangePasswordNextSignIn: true,
                            password: params.password,
                        },
                    }),
                },
            );

            if (isMicrosoftAddressConflict(response.status, payload)) continue;

            if (!response.ok) {
                console.error(
                    "Microsoft 365 user create failed",
                    response.status,
                );
                return {
                    ok: false as const,
                    message: "Microsoft Graph hat das Konto abgelehnt.",
                };
            }

            const user =
                payload && typeof payload === "object"
                    ? (payload as GraphUser)
                    : null;
            const externalId =
                typeof user?.id === "string" ? user.id.trim() : "";
            const workEmail =
                typeof user?.userPrincipalName === "string"
                    ? user.userPrincipalName.trim() || userPrincipalName
                    : userPrincipalName;
            if (!externalId) {
                return {
                    ok: false as const,
                    message:
                        "Microsoft Graph hat keine Benutzerkennung geliefert.",
                };
            }
            return { ok: true as const, externalId, workEmail };
        }

        return {
            ok: false as const,
            message: "Die Arbeits-E-Mail ist bereits vergeben.",
        };
    }

    async function assignLicense(params: AssignLicenseInput) {
        const { response } = await graphRequest(
            params.token,
            `/users/${encodeURIComponent(params.externalId)}/assignLicense`,
            {
                method: "POST",
                body: JSON.stringify({
                    addLicenses: [{ skuId: params.licenseSkuId }],
                    removeLicenses: [],
                }),
            },
        );
        if (!response.ok) {
            console.error(
                "Microsoft 365 license assignment failed",
                response.status,
            );
            return false;
        }
        return true;
    }

    async function deleteUser(token: string, externalId: string) {
        const { response } = await graphRequest(
            token,
            `/users/${encodeURIComponent(externalId)}`,
            { method: "DELETE" },
        );
        return response.status === 204;
    }

    return { getToken, createUser: createGraphUser, assignLicense, deleteUser };
}
