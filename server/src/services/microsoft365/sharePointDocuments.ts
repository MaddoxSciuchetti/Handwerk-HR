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
    paginationPath,
} from "@/services/microsoftTeams/graph";

const GRAPH = "https://graph.microsoft.com/v1.0";
const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "txt"]);
const MIME_BY_EXTENSION: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
};
const MAX_LIVE_DRIVES = 5;
const MAX_LIVE_ITEMS_PER_DRIVE = 400;
const MAX_LIVE_FOLDER_EXPANDS = 80;
const MAX_PARENT_FOLDERS = 20;
const MAX_RESULTS = 50;

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
    folder?: Record<string, unknown>;
    parentReference?: {
        id?: string;
        driveId?: string;
        name?: string;
        path?: string;
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

function mapHit(
    resource: SearchHitResource,
    fallbackDriveId?: string,
): SharePointFileHit | null {
    const id = resource.id?.trim();
    const driveId =
        resource.parentReference?.driveId?.trim() || fallbackDriveId?.trim();
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
        id: "mock-sharepoint-text-1",
        driveId: "mock-drive",
        name: "Text 1.docx",
        size: 100,
        lastModified: "2026-10-30T12:00:00Z",
        mimeType: MIME_BY_EXTENSION.docx,
        webUrl: "https://example.test/Text%201.docx",
        libraryName: "Neue_Mitarbeiter",
    },
    {
        id: "mock-sharepoint-text-2",
        driveId: "mock-drive",
        name: "Text 2.docx",
        size: 100,
        lastModified: "2026-10-30T12:01:00Z",
        mimeType: MIME_BY_EXTENSION.docx,
        webUrl: "https://example.test/Text%202.docx",
        libraryName: "Neue_Mitarbeiter",
    },
    {
        id: "mock-sharepoint-text-4",
        driveId: "mock-drive",
        name: "Text 4.docx",
        size: 100,
        lastModified: "2026-10-30T12:04:00Z",
        mimeType: MIME_BY_EXTENSION.docx,
        webUrl: "https://example.test/Text%204.docx",
        libraryName: "Neue_Mitarbeiter",
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

function matchesQuery(name: string, query: string) {
    return name.toLocaleLowerCase("de").includes(query.toLocaleLowerCase("de"));
}

function collectHits(
    hits: SharePointFileHit[],
    seen: Set<string>,
    resource: SearchHitResource | null | undefined,
    fallbackDriveId?: string,
) {
    const mapped = resource ? mapHit(resource, fallbackDriveId) : null;
    if (!mapped) return;
    // Same file can appear from recent + live scan with different item ids.
    const key = `${mapped.driveId}:${mapped.name.toLocaleLowerCase("de")}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push(mapped);
}

function searchQueryString(trimmed: string) {
    const safe = trimmed.replace(/["\\]/g, "");
    // Prefix/wildcard matching so "text" hits Text 1.docx … Text 4.docx, not only one ranked hit.
    return `(filename:${safe}* OR ${safe}*) (FileExtension:docx OR FileExtension:pdf OR FileExtension:txt OR FileType:docx OR FileType:pdf OR FileType:txt)`;
}

async function searchIndexedFiles(token: string, trimmed: string) {
    return graphFetch(token, "/search/query", {
        method: "POST",
        body: JSON.stringify({
            requests: [
                {
                    entityTypes: ["driveItem"],
                    query: { queryString: searchQueryString(trimmed) },
                    from: 0,
                    size: 50,
                },
            ],
        }),
    });
}

async function fetchRecentFiles(token: string) {
    return graphFetch(
        token,
        "/me/drive/recent?$top=100&$select=id,name,size,webUrl,lastModifiedDateTime,file,folder,parentReference",
    );
}

type DriveChildPage = {
    value?: SearchHitResource[];
    "@odata.nextLink"?: string;
};

async function listDriveChildren(
    token: string,
    driveId: string,
    itemId: string,
): Promise<SearchHitResource[]> {
    const items: SearchHitResource[] = [];
    let path: string | undefined =
        `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/children?$top=200&$select=id,name,size,webUrl,lastModifiedDateTime,file,folder,parentReference`;
    const visited = new Set<string>();
    while (path && items.length < MAX_LIVE_ITEMS_PER_DRIVE) {
        if (visited.has(path) || visited.size >= 20) break;
        visited.add(path);
        const response = await graphFetch(token, path);
        if (response.status === 401) return Promise.reject({ status: 401 });
        if (!response.ok) break;
        const payload = (await response.json()) as DriveChildPage;
        items.push(...(payload.value ?? []));
        path = payload["@odata.nextLink"]
            ? paginationPath(payload["@odata.nextLink"])
            : undefined;
    }
    return items;
}

function withDrive(
    child: SearchHitResource,
    driveId: string,
    parentId?: string,
): SearchHitResource {
    return {
        ...child,
        parentReference: {
            ...child.parentReference,
            id: parentId ?? child.parentReference?.id,
            driveId,
        },
    };
}

function matchingFilesInChildren(
    children: SearchHitResource[],
    driveId: string,
    query: string,
    parentId?: string,
) {
    const matches: SearchHitResource[] = [];
    for (const child of children) {
        if (
            child.file &&
            child.name &&
            isAllowedFile(child.name) &&
            matchesQuery(child.name, query)
        ) {
            matches.push(withDrive(child, driveId, parentId));
        }
    }
    return matches;
}

/**
 * List every file in the same folders as known hits/recent items.
 * That picks up siblings like Test 4.docx when only Test 1–3 are indexed yet.
 */
async function listSiblingMatches(
    token: string,
    items: SearchHitResource[],
    query: string,
): Promise<SearchHitResource[]> {
    const parents: Array<{ driveId: string; itemId: string }> = [];
    const seen = new Set<string>();
    for (const item of items) {
        const driveId = item.parentReference?.driveId?.trim();
        const itemId = item.parentReference?.id?.trim();
        if (!driveId || !itemId) continue;
        const key = `${driveId}:${itemId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        parents.push({ driveId, itemId });
        if (parents.length >= MAX_PARENT_FOLDERS) break;
    }

    const matches: SearchHitResource[] = [];
    await Promise.all(
        parents.map(async ({ driveId, itemId }) => {
            try {
                const children = await listDriveChildren(token, driveId, itemId);
                matches.push(
                    ...matchingFilesInChildren(children, driveId, query, itemId),
                );
            } catch (error) {
                if (
                    error &&
                    typeof error === "object" &&
                    "status" in error &&
                    error.status === 401
                ) {
                    throw error;
                }
            }
        }),
    );
    return matches;
}

/** Walk the live drive tree (not the search index) so new files appear immediately. */
async function liveScanDrive(
    token: string,
    driveId: string,
    query: string,
): Promise<SearchHitResource[]> {
    const matches: SearchHitResource[] = [];
    const queue: string[] = ["root"];
    let itemsSeen = 0;
    let foldersExpanded = 0;

    while (queue.length > 0 && itemsSeen < MAX_LIVE_ITEMS_PER_DRIVE) {
        const itemId = queue.shift()!;
        let children: SearchHitResource[];
        try {
            children = await listDriveChildren(token, driveId, itemId);
        } catch (error) {
            if (
                error &&
                typeof error === "object" &&
                "status" in error &&
                error.status === 401
            ) {
                throw error;
            }
            break;
        }

        const priorityFolders: string[] = [];
        const otherFolders: string[] = [];
        for (const child of children) {
            itemsSeen += 1;
            if (!child.id) continue;
            if (child.folder) {
                if (child.name && matchesQuery(child.name, query)) {
                    priorityFolders.push(child.id);
                } else {
                    otherFolders.push(child.id);
                }
                continue;
            }
            if (
                child.file &&
                child.name &&
                isAllowedFile(child.name) &&
                matchesQuery(child.name, query)
            ) {
                matches.push(withDrive(child, driveId, itemId === "root" ? undefined : itemId));
            }
            if (matches.length >= MAX_RESULTS) return matches;
        }

        for (const folderId of [...priorityFolders, ...otherFolders]) {
            if (foldersExpanded >= MAX_LIVE_FOLDER_EXPANDS) break;
            foldersExpanded += 1;
            queue.push(folderId);
        }
    }
    return matches;
}

function uniqueDriveIds(items: SearchHitResource[]) {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const item of items) {
        const driveId = item.parentReference?.driveId?.trim();
        if (!driveId || seen.has(driveId)) continue;
        seen.add(driveId);
        ids.push(driveId);
        if (ids.length >= MAX_LIVE_DRIVES) break;
    }
    return ids;
}

function isAuthError(error: unknown): error is { status: 401 } {
    if (!error || typeof error !== "object" || !("status" in error)) {
        return false;
    }
    return (error as { status?: unknown }).status === 401;
}

function sortHits(hits: SharePointFileHit[]) {
    return hits.sort((a, b) =>
        a.name.localeCompare(b.name, "de", { numeric: true }),
    );
}

export async function searchSharePointFiles(
    actor: Actor,
    query: string,
): Promise<SharePointFileHit[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    if (integrationsMocked()) {
        await assertActiveMember(actor);
        return sortHits(
            MOCK_FILES.filter((file) => matchesQuery(file.name, trimmed)),
        );
    }

    const auth = await accessToken(actor);
    const [indexedResponse, recentResponse] = await Promise.all([
        searchIndexedFiles(auth.token, trimmed),
        fetchRecentFiles(auth.token),
    ]);

    if (indexedResponse.status === 401 || recentResponse.status === 401) {
        await authenticationRejected(actor);
        throw new TeamsError(
            "reconnect_required",
            "Bitte Microsoft unter Einstellungen → Integrationen erneut verbinden.",
        );
    }
    if (!indexedResponse.ok && !recentResponse.ok) {
        throw new TeamsError(
            "sharepoint_search_failed",
            "Microsoft konnte die SharePoint-Suche nicht ausführen. Bitte Berechtigungen prüfen.",
            indexedResponse.status === 403 || recentResponse.status === 403
                ? 403
                : 503,
        );
    }

    const hits: SharePointFileHit[] = [];
    const seen = new Set<string>();
    let recentItems: SearchHitResource[] = [];
    const seedItems: SearchHitResource[] = [];

    if (recentResponse.ok) {
        const payload = (await recentResponse.json()) as {
            value?: SearchHitResource[];
        };
        recentItems = payload.value ?? [];
        for (const item of recentItems) {
            seedItems.push(item);
            if (!item.name || !matchesQuery(item.name, trimmed)) continue;
            collectHits(hits, seen, item);
        }
    }

    if (indexedResponse.ok) {
        const payload = (await indexedResponse.json()) as {
            value?: Array<{
                hitsContainers?: Array<{
                    hits?: Array<{ resource?: SearchHitResource }>;
                }>;
            }>;
        };
        for (const container of payload.value ?? []) {
            for (const hitContainer of container.hitsContainers ?? []) {
                for (const hit of hitContainer.hits ?? []) {
                    if (hit.resource) seedItems.push(hit.resource);
                    collectHits(hits, seen, hit.resource);
                }
            }
        }
    }

    try {
        const siblings = await listSiblingMatches(
            auth.token,
            seedItems,
            trimmed,
        );
        for (const item of siblings) {
            collectHits(hits, seen, item);
        }
    } catch (error) {
        if (isAuthError(error)) {
            await authenticationRejected(actor);
            throw new TeamsError(
                "reconnect_required",
                "Bitte Microsoft unter Einstellungen → Integrationen erneut verbinden.",
            );
        }
    }

    const driveIds = uniqueDriveIds(seedItems);
    if (driveIds.length > 0) {
        const liveResults = await Promise.all(
            driveIds.map(async (driveId) => {
                try {
                    return await liveScanDrive(auth.token, driveId, trimmed);
                } catch (error) {
                    if (isAuthError(error)) throw error;
                    return [] as SearchHitResource[];
                }
            }),
        ).catch(async (error) => {
            if (isAuthError(error)) {
                await authenticationRejected(actor);
                throw new TeamsError(
                    "reconnect_required",
                    "Bitte Microsoft unter Einstellungen → Integrationen erneut verbinden.",
                );
            }
            return [] as SearchHitResource[][];
        });
        for (const [index, items] of liveResults.entries()) {
            for (const item of items) {
                collectHits(hits, seen, item, driveIds[index]);
            }
        }
    }

    return sortHits(hits).slice(0, MAX_RESULTS);
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
