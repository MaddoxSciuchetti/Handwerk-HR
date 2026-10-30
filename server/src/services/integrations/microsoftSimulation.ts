import { createHash, randomUUID } from "node:crypto";
import { microsoftSimulationEnabled } from "@/constants/env";

export const SIMULATION_TOKEN = "simulation-microsoft-token";
export const SIMULATION_CONFIG = {
    tenantId: "simulation",
    clientId: "simulation",
    clientSecret: "simulation",
    domain: "staging.example.test",
    licenseSkuId: "simulation",
};

const accountEnabled = new Map<string, boolean>();
const assignedLicenses = new Map<string, string[]>();

function simulatedUserId(key: string) {
    return key.startsWith("simulation-microsoft-")
        ? key
        : `simulation-microsoft-${createHash("sha256").update(key).digest("hex").slice(0, 24)}`;
}

/** All simulated operations terminate here; unknown operations never fall through to fetch. */
export async function microsoftGraphFetch(
    url: string,
    init?: RequestInit,
): Promise<Response> {
    if (!microsoftSimulationEnabled()) {
        if (
            url.includes("simulation-microsoft-") ||
            new Headers(init?.headers).get("Authorization") ===
                `Bearer ${SIMULATION_TOKEN}`
        ) {
            throw new Error(
                "Simulierte Microsoft-Daten können nicht live verwendet werden.",
            );
        }
        return fetch(url, init);
    }

    const path = new URL(url).pathname.replace(/^\/v1\.0/, "");
    const method = init?.method ?? "GET";
    if (method === "POST" && path === "/search/query") {
        return Response.json({
            value: [
                {
                    hitsContainers: [
                        {
                            hits: [
                                {
                                    resource: {
                                        id: "simulation-sharepoint-contract",
                                        name: "Arbeitsvertrag Vorlage.docx",
                                        size: 12345,
                                        webUrl: "https://example.test/contract.docx",
                                        lastModifiedDateTime:
                                            "2026-01-15T10:00:00Z",
                                        file: {
                                            mimeType:
                                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                        },
                                        parentReference: {
                                            driveId: "simulation-drive",
                                            name: "Vorlagen",
                                            path: "/drives/simulation-drive/root:/Vorlagen",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    }
    const driveItem = path.match(
        /^\/drives\/([^/]+)\/items\/([^/]+)(?:\/content)?$/,
    );
    if (driveItem) {
        const [, driveId, itemId] = driveItem;
        const isContent = path.endsWith("/content");
        if (method === "GET" && !isContent) {
            return Response.json({
                id: decodeURIComponent(itemId),
                name: "Arbeitsvertrag Vorlage.docx",
                size: 12345,
                file: {
                    mimeType:
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                },
                parentReference: { driveId: decodeURIComponent(driveId) },
            });
        }
        if (method === "GET" && isContent) {
            return new Response("Simulierter SharePoint-Inhalt", {
                status: 200,
                headers: { "Content-Type": "text/plain" },
            });
        }
    }
    if (method === "GET" && path === "/groups") {
        return Response.json({
            value: [
                {
                    id: "simulation-microsoft-office",
                    displayName: "Büro (Test)",
                },
                {
                    id: "simulation-microsoft-field",
                    displayName: "Handwerk (Test)",
                },
            ],
        });
    }
    if (
        method === "GET" &&
        /^\/groups\/[^/]+\/transitiveMembers\/microsoft\.graph\.user$/.test(
            path,
        )
    ) {
        return Response.json({
            value: [{ mail: "team@staging.example.test" }],
        });
    }
    if (method === "POST" && /^\/users\/[^/]+\/sendMail$/.test(path)) {
        return new Response(null, { status: 202 });
    }
    if (method === "POST" && path === "/users") {
        const body = JSON.parse(String(init?.body));
        const id = `simulation-microsoft-${randomUUID()}`;
        accountEnabled.set(id, true);
        return Response.json(
            { id, userPrincipalName: body.userPrincipalName },
            { status: 201 },
        );
    }
    const licenseDetails = path.match(/^\/users\/([^/]+)\/licenseDetails$/);
    if (method === "GET" && licenseDetails) {
        const id = simulatedUserId(decodeURIComponent(licenseDetails[1]));
        return Response.json({ value: (assignedLicenses.get(id) ?? []).map((skuId) => ({ skuId })) });
    }
    const user = path.match(/^\/users\/([^/]+)(\/assignLicense)?$/);
    if (user) {
        const id = simulatedUserId(decodeURIComponent(user[1]));
        if (method === "GET" && !user[2]) {
            return Response.json({
                id,
                accountEnabled: accountEnabled.get(id) ?? true,
            });
        }
        if (method === "PATCH" && !user[2]) {
            const body = JSON.parse(String(init?.body));
            accountEnabled.set(id, body.accountEnabled !== false);
            return new Response(null, { status: 204 });
        }
        if (method === "POST" && user[2]) {
            const body = JSON.parse(String(init?.body));
            const removed = new Set((body.removeLicenses ?? []).map((sku: string) => sku.toLowerCase()));
            assignedLicenses.set(id, [...(assignedLicenses.get(id) ?? []).filter((sku) => !removed.has(sku.toLowerCase())), ...(body.addLicenses ?? []).map((license: { skuId: string }) => license.skuId)]);
            return Response.json({ id });
        }
        if (method === "DELETE" && !user[2]) {
            accountEnabled.delete(id);
            assignedLicenses.delete(id);
            return new Response(null, { status: 204 });
        }
    }
    throw new Error(
        `Microsoft-Simulation unterstützt diese Operation nicht: ${method} ${path}`,
    );
}
