import { integrationsMocked } from "@/services/integrations/localMock";
import {
    accessToken,
    assertActiveMember,
    TeamsError,
    type Actor,
} from "@/services/microsoftTeams/connection";
import {
    authenticationRejected,
    graphFetch,
} from "@/services/microsoftTeams/graph";

const GRAPH = "https://graph.microsoft.com/v1.0";
const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "txt"]);
const MIME_BY_EXTENSION: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
};

export type SharePointFileHit = {
    id: string;
    driveId: string;
    name: string;
    size: number | null;
    lastModified: string | null;
    mimeType: string | null;
    webUrl: string | null;
    libraryName: string | null;
};

type SearchHitResource = {
    id?: string;
    name?: string;
    size?: number;
    webUrl?: string;
    lastModifiedDateTime?: string;
    file?: { mimeType?: string };
    parentReference?: {
        driveId?: string;
        name?: string;
        path?: string;
        sharepointIds?: { listId?: string };
    };
    listItem?: {
        sharepointIds?: { listId?: string };
    };
};

function extensionOf(name: string) {
    const match = /\.([^.]+)$/.exec(name.trim());
    return match ? match[1].toLowerCase() : "";
}

function isAllowedFile(name: string) {
    return ALLOWED_EXTENSIONS.has(extensionOf(name));
}

function mimeFor(name: string, mimeType?: string | null) {
    if (mimeType?.trim()) return mimeType;
    return MIME_BY_EXTENSION[extensionOf(name)] ?? "application/octet-stream";
}

function libraryNameFrom(resource: SearchHitResource) {
    const path = resource.parentReference?.path ?? "";
    const match = /\/drives\/[^/]+\/root:\/([^/]+)/.exec(path);
    if (match?.[1]) return decodeURIComponent(match[1]);
    if (resource.parentReference?.name?.trim())
        return resource.parentReference.name.trim();
    return null;
}

function mapHit(resource: SearchHitResource): SharePointFileHit | null {
    const id = resource.id?.trim();
    const driveId = resource.parentReference?.driveId?.trim();
    const name = resource.name?.trim();
    if (!id || !driveId || !name || !isAllowedFile(name)) return null;
    return {
        id,
        driveId,
        name,
        size: typeof resource.size === "number" ? resource.size : null,
        lastModified: resource.lastModifiedDateTime ?? null,
        mimeType: resource.file?.mimeType ?? mimeFor(name),
        webUrl: resource.webUrl ?? null,
        libraryName: libraryNameFrom(resource),
    };
}

const MOCK_FILES: SharePointFileHit[] = [
    {
        id: "mock-sharepoint-contract",
        driveId: "mock-drive",
        name: "Arbeitsvertrag Vorlage.docx",
        size: 12_345,
        lastModified: "2026-01-15T10:00:00Z",
        mimeType: MIME_BY_EXTENSION.docx,
        webUrl: "https://example.test/Arbeitsvertrag%20Vorlage.docx",
        libraryName: "Vorlagen",
    },
    {
        id: "mock-sharepoint-nda",
        driveId: "mock-drive",
        name: "Geheimhaltung.pdf",
        size: 4_321,
        lastModified: "2026-02-01T09:00:00Z",
        mimeType: MIME_BY_EXTENSION.pdf,
        webUrl: "https://example.test/Geheimhaltung.pdf",
        libraryName: "Verträge",
    },
    {
        id: "mock-sharepoint-note",
        driveId: "mock-drive",
        name: "Hinweise.txt",
        size: 120,
        lastModified: "2026-03-01T08:00:00Z",
        mimeType: MIME_BY_EXTENSION.txt,
        webUrl: "https://example.test/Hinweise.txt",
        libraryName: "Vorlagen",
    },
];

export async function searchSharePointFiles(
    actor: Actor,
    query: string,
): Promise<SharePointFileHit[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    if (integrationsMocked()) {
        await assertActiveMember(actor);
        const needle = trimmed.toLocaleLowerCase("de");
        return MOCK_FILES.filter((file) =>
            file.name.toLocaleLowerCase("de").includes(needle),
        );
    }

    const auth = await accessToken(actor);
    const response = await graphFetch(auth.token, "/search/query", {
        method: "POST",
        body: JSON.stringify({
            requests: [
                {
                    entityTypes: ["driveItem"],
                    query: {
                        queryString: `${trimmed} (FileExtension:docx OR FileExtension:pdf OR FileExtension:txt)`,
                    },
                    from: 0,
                    size: 25,
                },
            ],
        }),
    });
    if (response.status === 401) {
        await authenticationRejected(actor);
        throw new TeamsError(
            "reconnect_required",
            "Bitte Microsoft unter Einstellungen → Integrationen erneut verbinden.",
        );
    }
    if (!response.ok) {
        throw new TeamsError(
            "sharepoint_search_failed",
            "Microsoft konnte die SharePoint-Suche nicht ausführen. Bitte Berechtigungen prüfen.",
            response.status === 403 ? 403 : 503,
        );
    }

    const payload = (await response.json()) as {
        value?: Array<{
            hitsContainers?: Array<{
                hits?: Array<{ resource?: SearchHitResource }>;
            }>;
        }>;
    };
    const hits: SharePointFileHit[] = [];
    const seen = new Set<string>();
    for (const container of payload.value ?? []) {
        for (const hitContainer of container.hitsContainers ?? []) {
            for (const hit of hitContainer.hits ?? []) {
                const mapped = hit.resource ? mapHit(hit.resource) : null;
                if (!mapped) continue;
                const key = `${mapped.driveId}:${mapped.id}`;
                if (seen.has(key)) continue;
                seen.add(key);
                hits.push(mapped);
            }
        }
    }
    return hits;
}

export async function downloadSharePointFile(
    actor: Actor,
    input: { driveId: string; itemId: string },
): Promise<{
    buffer: Buffer;
    name: string;
    mimeType: string;
}> {
    const driveId = input.driveId.trim();
    const itemId = input.itemId.trim();
    if (!driveId || !itemId) {
        throw new TeamsError(
            "invalid_request",
            "Die SharePoint-Datei ist ungültig.",
        );
    }

    if (integrationsMocked()) {
        await assertActiveMember(actor);
        const mock = MOCK_FILES.find(
            (file) => file.driveId === driveId && file.id === itemId,
        );
        if (!mock) {
            throw new TeamsError(
                "sharepoint_file_missing",
                "Die SharePoint-Datei wurde nicht gefunden.",
                404,
            );
        }
        const body =
            extensionOf(mock.name) === "txt"
                ? "Simulierter SharePoint-Text."
                : `mock-${mock.name}`;
        return {
            buffer: Buffer.from(body, "utf8"),
            name: mock.name,
            mimeType: mimeFor(mock.name, mock.mimeType),
        };
    }

    const auth = await accessToken(actor);
    const metaResponse = await graphFetch(
        auth.token,
        `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}?$select=id,name,size,file,parentReference`,
    );
    if (metaResponse.status === 401) {
        await authenticationRejected(actor);
        throw new TeamsError(
            "reconnect_required",
            "Bitte Microsoft unter Einstellungen → Integrationen erneut verbinden.",
        );
    }
    if (metaResponse.status === 404) {
        throw new TeamsError(
            "sharepoint_file_missing",
            "Die SharePoint-Datei wurde nicht gefunden.",
            404,
        );
    }
    if (!metaResponse.ok) {
        throw new TeamsError(
            "sharepoint_download_failed",
            "Microsoft konnte die SharePoint-Datei nicht laden.",
            metaResponse.status === 403 ? 403 : 503,
        );
    }
    const meta = (await metaResponse.json()) as SearchHitResource;
    const name = meta.name?.trim() ?? "";
    if (!name || !isAllowedFile(name)) {
        throw new TeamsError(
            "unsupported_file",
            "Bitte PDF-, Word- (.docx) oder Textdateien (.txt) auswählen.",
        );
    }

    const contentResponse = await fetch(
        `${GRAPH}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/content`,
        {
            method: "GET",
            redirect: "follow",
            signal: AbortSignal.timeout(60_000),
            headers: { Authorization: `Bearer ${auth.token}` },
        },
    );
    if (contentResponse.status === 401) {
        await authenticationRejected(actor);
        throw new TeamsError(
            "reconnect_required",
            "Bitte Microsoft unter Einstellungen → Integrationen erneut verbinden.",
        );
    }
    if (!contentResponse.ok) {
        throw new TeamsError(
            "sharepoint_download_failed",
            "Microsoft konnte die SharePoint-Datei nicht laden.",
            contentResponse.status === 403 ? 403 : 503,
        );
    }
    const buffer = Buffer.from(await contentResponse.arrayBuffer());
    if (buffer.length > 10 * 1024 * 1024) {
        throw new TeamsError(
            "file_too_large",
            "Die Datei ist zu groß (maximal 10 MB).",
        );
    }
    return {
        buffer,
        name,
        mimeType: mimeFor(name, meta.file?.mimeType),
    };
}

export function sharePointFileAsMulter(file: {
    buffer: Buffer;
    name: string;
    mimeType: string;
}): Express.Multer.File {
    return {
        fieldname: "file",
        originalname: file.name,
        encoding: "7bit",
        mimetype: file.mimeType,
        size: file.buffer.length,
        buffer: file.buffer,
        destination: "",
        filename: file.name,
        path: "",
        stream: undefined as unknown as Express.Multer.File["stream"],
    };
}
