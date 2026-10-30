import { accessToken, assertActiveMember } from "@/services/microsoftTeams/connection";
import { authenticationRejected, graphFetch } from "@/services/microsoftTeams/graph";
import {
    downloadSharePointFile,
    searchSharePointFiles,
    sharePointFileAsMulter,
} from "./sharePointDocuments";

jest.mock("@/services/integrations/localMock", () => ({
    integrationsMocked: jest.fn(() => false),
}));

jest.mock("@/services/microsoftTeams/connection", () => ({
    accessToken: jest.fn(),
    assertActiveMember: jest.fn(),
    TeamsError: jest.requireActual("@/services/microsoftTeams/connection")
        .TeamsError,
}));

jest.mock("@/services/microsoftTeams/graph", () => ({
    authenticationRejected: jest.fn(),
    graphFetch: jest.fn(),
    paginationPath: jest.requireActual("@/services/microsoftTeams/graph")
        .paginationPath,
}));

const { integrationsMocked } = jest.requireMock(
    "@/services/integrations/localMock",
) as { integrationsMocked: jest.Mock };

const actor = { organizationId: "org", userId: "user" };
const fetchMock = jest.fn();
const originalFetch = global.fetch;

beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as typeof fetch;
    integrationsMocked.mockReturnValue(false);
    (accessToken as jest.Mock).mockResolvedValue({ token: "user-token" });
    (assertActiveMember as jest.Mock).mockResolvedValue(undefined);
});

afterAll(() => {
    global.fetch = originalFetch;
});

function jsonResponse(status: number, body: unknown) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

function mockGraph(params: {
    search?: Response;
    recent?: Response;
    childrenByItem?: Record<string, Response>;
}) {
    (graphFetch as jest.Mock).mockImplementation(
        async (_token: string, path: string) => {
            if (path === "/search/query") {
                return (
                    params.search ??
                    jsonResponse(200, { value: [{ hitsContainers: [] }] })
                );
            }
            if (path.startsWith("/me/drive/recent")) {
                return params.recent ?? jsonResponse(200, { value: [] });
            }
            const children = path.match(
                /^\/drives\/([^/]+)\/items\/([^/]+)\/children/,
            );
            if (children) {
                const itemId = decodeURIComponent(children[2]);
                return (
                    params.childrenByItem?.[itemId] ??
                    jsonResponse(200, { value: [] })
                );
            }
            throw new Error(`unexpected graph path ${path}`);
        },
    );
}

it("maps Graph search hits to allowed SharePoint files", async () => {
    mockGraph({
        search: jsonResponse(200, {
            value: [
                {
                    hitsContainers: [
                        {
                            hits: [
                                {
                                    resource: {
                                        id: "item-1",
                                        name: "Vertrag.docx",
                                        size: 10,
                                        webUrl: "https://example.test/v.docx",
                                        lastModifiedDateTime:
                                            "2026-01-01T00:00:00Z",
                                        file: {
                                            mimeType:
                                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                        },
                                        parentReference: {
                                            driveId: "drive-1",
                                            name: "Vorlagen",
                                        },
                                    },
                                },
                                {
                                    resource: {
                                        id: "item-2",
                                        name: "bild.png",
                                        parentReference: { driveId: "drive-1" },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        }),
    });

    await expect(searchSharePointFiles(actor, "Vertrag")).resolves.toEqual([
        {
            id: "item-1",
            driveId: "drive-1",
            name: "Vertrag.docx",
            size: 10,
            lastModified: "2026-01-01T00:00:00Z",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            webUrl: "https://example.test/v.docx",
            libraryName: "Vorlagen",
        },
    ]);
});

it("includes recent files that are not in the search index yet", async () => {
    mockGraph({
        search: jsonResponse(200, { value: [{ hitsContainers: [] }] }),
        recent: jsonResponse(200, {
            value: [
                {
                    id: "recent-1",
                    name: "Test 1.docx",
                    size: 20,
                    lastModifiedDateTime: "2026-10-30T12:00:00Z",
                    file: {
                        mimeType:
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    },
                    parentReference: {
                        driveId: "drive-bsb",
                        name: "Dokumente",
                        path: "/drives/drive-bsb/root:/Neue_Mitarbeiter",
                    },
                },
            ],
        }),
        childrenByItem: {
            root: jsonResponse(200, { value: [] }),
        },
    });

    await expect(searchSharePointFiles(actor, "Test")).resolves.toEqual([
        expect.objectContaining({
            id: "recent-1",
            driveId: "drive-bsb",
            name: "Test 1.docx",
        }),
    ]);
});

it("live-scans recent drives so every matching Text file appears", async () => {
    mockGraph({
        search: jsonResponse(200, { value: [{ hitsContainers: [] }] }),
        recent: jsonResponse(200, {
            value: [
                {
                    id: "recent-4",
                    name: "Text 4.docx",
                    file: {
                        mimeType:
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    },
                    parentReference: {
                        id: "folder-neue",
                        driveId: "drive-bsb",
                    },
                },
            ],
        }),
        childrenByItem: {
            root: jsonResponse(200, {
                value: [
                    {
                        id: "folder-neue",
                        name: "Neue_Mitarbeiter",
                        folder: {},
                    },
                ],
            }),
            "folder-neue": jsonResponse(200, {
                value: [
                    {
                        id: "text-1",
                        name: "Text 1.docx",
                        file: {
                            mimeType:
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        },
                    },
                    {
                        id: "text-2",
                        name: "Text 2.docx",
                        file: {
                            mimeType:
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        },
                    },
                    {
                        id: "text-4",
                        name: "Text 4.docx",
                        file: {
                            mimeType:
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        },
                    },
                    {
                        id: "other",
                        name: "Other.docx",
                        file: {
                            mimeType:
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        },
                    },
                ],
            }),
        },
    });

    const files = await searchSharePointFiles(actor, "text");
    expect(files.map((file) => file.name)).toEqual([
        "Text 1.docx",
        "Text 2.docx",
        "Text 4.docx",
    ]);
});

it("lists siblings of indexed hits so newer files like Test 4 still appear", async () => {
    mockGraph({
        search: jsonResponse(200, {
            value: [
                {
                    hitsContainers: [
                        {
                            hits: [
                                {
                                    resource: {
                                        id: "test-1",
                                        name: "Test 1.docx",
                                        file: {
                                            mimeType:
                                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                        },
                                        parentReference: {
                                            id: "folder-neue",
                                            driveId: "drive-bsb",
                                        },
                                    },
                                },
                                {
                                    resource: {
                                        id: "test-2",
                                        name: "Test 2.docx",
                                        file: {
                                            mimeType:
                                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                        },
                                        parentReference: {
                                            id: "folder-neue",
                                            driveId: "drive-bsb",
                                        },
                                    },
                                },
                                {
                                    resource: {
                                        id: "test-3",
                                        name: "Test 3.docx",
                                        file: {
                                            mimeType:
                                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                        },
                                        parentReference: {
                                            id: "folder-neue",
                                            driveId: "drive-bsb",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        }),
        recent: jsonResponse(200, { value: [] }),
        childrenByItem: {
            "folder-neue": jsonResponse(200, {
                value: [
                    {
                        id: "test-1",
                        name: "Test 1.docx",
                        file: {
                            mimeType:
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        },
                    },
                    {
                        id: "test-2",
                        name: "Test 2.docx",
                        file: {
                            mimeType:
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        },
                    },
                    {
                        id: "test-3",
                        name: "Test 3.docx",
                        file: {
                            mimeType:
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        },
                    },
                    {
                        id: "test-4",
                        name: "Test 4.docx",
                        file: {
                            mimeType:
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        },
                    },
                ],
            }),
            root: jsonResponse(200, { value: [] }),
        },
    });

    const files = await searchSharePointFiles(actor, "Test");
    expect(files.map((file) => file.name)).toEqual([
        "Test 1.docx",
        "Test 2.docx",
        "Test 3.docx",
        "Test 4.docx",
    ]);
});

it("marks reconnect required when SharePoint search is unauthorized", async () => {
    mockGraph({
        search: jsonResponse(401, {}),
        recent: jsonResponse(200, { value: [] }),
    });
    await expect(searchSharePointFiles(actor, "x")).rejects.toMatchObject({
        code: "reconnect_required",
        statusCode: 400,
    });
    expect(authenticationRejected).toHaveBeenCalledWith(actor);
});

it("downloads SharePoint content with the user token", async () => {
    (graphFetch as jest.Mock).mockResolvedValue(
        jsonResponse(200, {
            id: "item-1",
            name: "Hinweis.txt",
            file: { mimeType: "text/plain" },
            parentReference: { driveId: "drive-1" },
        }),
    );
    fetchMock.mockResolvedValue(
        new Response("Hallo SharePoint", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
        }),
    );

    const file = await downloadSharePointFile(actor, {
        driveId: "drive-1",
        itemId: "item-1",
    });
    expect(file).toEqual({
        buffer: Buffer.from("Hallo SharePoint", "utf8"),
        name: "Hinweis.txt",
        mimeType: "text/plain",
    });
    expect(sharePointFileAsMulter(file).originalname).toBe("Hinweis.txt");
});

it("rejects unsupported SharePoint downloads", async () => {
    (graphFetch as jest.Mock).mockResolvedValue(
        jsonResponse(200, {
            id: "item-1",
            name: "foto.png",
            parentReference: { driveId: "drive-1" },
        }),
    );
    await expect(
        downloadSharePointFile(actor, { driveId: "drive-1", itemId: "item-1" }),
    ).rejects.toMatchObject({ code: "unsupported_file" });
});

it("returns all mock Text matches when integrations are mocked", async () => {
    integrationsMocked.mockReturnValue(true);
    const files = await searchSharePointFiles(actor, "Text");
    expect(files.map((file) => file.name)).toEqual([
        "Text 1.docx",
        "Text 2.docx",
        "Text 4.docx",
    ]);
});
