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

it("maps Graph search hits to allowed SharePoint files", async () => {
    (graphFetch as jest.Mock).mockResolvedValue(
        jsonResponse(200, {
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
    );

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
    expect(graphFetch).toHaveBeenCalledWith(
        "user-token",
        "/search/query",
        expect.objectContaining({ method: "POST" }),
    );
});

it("marks reconnect required when SharePoint search is unauthorized", async () => {
    (graphFetch as jest.Mock).mockResolvedValue(jsonResponse(401, {}));
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

it("returns mock files when integrations are mocked", async () => {
    integrationsMocked.mockReturnValue(true);
    const files = await searchSharePointFiles(actor, "Arbeitsvertrag");
    expect(files).toEqual([
        expect.objectContaining({
            id: "mock-sharepoint-contract",
            name: "Arbeitsvertrag Vorlage.docx",
        }),
    ]);
    const downloaded = await downloadSharePointFile(actor, {
        driveId: "mock-drive",
        itemId: "mock-sharepoint-contract",
    });
    expect(downloaded.name).toBe("Arbeitsvertrag Vorlage.docx");
    expect(assertActiveMember).toHaveBeenCalled();
});
