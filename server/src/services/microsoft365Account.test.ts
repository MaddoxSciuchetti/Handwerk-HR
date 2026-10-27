import { prisma } from "@/lib/prisma";
import { sendMail } from "@/utils/sendMail";
import {
    microsoftGraphToken,
    buildUserPrincipalName,
    foldMailPart,
    provisionMicrosoft365Account,
} from "@/services/microsoft365Account";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        worker: { findFirst: jest.fn() },
        $transaction: jest.fn(),
    },
}));

jest.mock("@/utils/sendMail", () => ({
    sendMail: jest.fn(),
}));

const findWorker = prisma.worker.findFirst as jest.Mock;
const transaction = prisma.$transaction as jest.Mock;
const mail = sendMail as jest.Mock;

const ENV_KEYS = [
    "INTEGRATIONS_LIVE",
    "MICROSOFT_365_TENANT_ID",
    "MICROSOFT_365_CLIENT_ID",
    "MICROSOFT_365_CLIENT_SECRET",
    "MICROSOFT_365_DOMAIN",
    "MICROSOFT_365_LICENSE_SKU_ID",
] as const;

const originalEnv = Object.fromEntries(
    ENV_KEYS.map((key) => [key, process.env[key]]),
);

function jsonResponse(body: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (body == null ? "" : JSON.stringify(body)),
    } as Response;
}

const config = {
    tenantId: "tenant",
    clientId: "client",
    clientSecret: "secret",
    domain: "firma.de",
    licenseSkuId: "sku-1",
};

function configureEnv() {
    process.env.INTEGRATIONS_LIVE = "true";
}

function clearEnv() {
    for (const key of ENV_KEYS) delete process.env[key];
}

describe("microsoft 365 account", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        for (const key of ENV_KEYS) {
            const value = originalEnv[key];
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    });

    it("builds an address from the worker name", () => {
        expect(foldMailPart("Jörg")).toBe("joerg");
        expect(
            buildUserPrincipalName({
                firstName: "Jörg",
                lastName: "Müller",
                domain: "@Firma.de",
                attempt: 1,
            }),
        ).toBe("joerg.mueller@firma.de");
        expect(
            buildUserPrincipalName({
                firstName: "Jörg",
                lastName: "Müller",
                domain: "firma.de",
                attempt: 2,
            }),
        ).toBe("joerg.mueller2@firma.de");
    });

    it("skips without calling Graph when credentials are missing", async () => {
        clearEnv();
        const fetchSpy = jest
            .spyOn(global, "fetch")
            .mockRejectedValue(new Error("should not call"));

        const result = await provisionMicrosoft365Account({
            organizationId: "org-1",
            workerId: "worker-1",
            config: null,
        });

        expect(result).toEqual({ status: "skipped", reason: "not_configured" });
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(findWorker).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    it("does not call Graph when sequences are not live", async () => {
        delete process.env.INTEGRATIONS_LIVE;
        findWorker.mockResolvedValue({
            id: "worker-1",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@personal.test",
            workEmail: null,
            externalAccounts: [],
        });
        const fetchSpy = jest
            .spyOn(global, "fetch")
            .mockRejectedValue(new Error("should not call"));

        const result = await provisionMicrosoft365Account({
            organizationId: "org-1",
            workerId: "worker-1",
            config,
        });

        expect(result).toEqual({ status: "skipped", reason: "not_live" });
        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    it("creates the user, stores a separate Microsoft email, and mails the communication address", async () => {
        configureEnv();
        findWorker.mockResolvedValue({
            id: "worker-1",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@personal.test",
            workEmail: "ada@communication.test",
            microsoftEmail: null,
            externalAccounts: [],
        });
        const updateWorker = jest.fn();
        const upsertAccount = jest.fn();
        transaction.mockImplementation(async (run: (tx: unknown) => unknown) =>
            run({
                worker: { update: updateWorker },
                workerExternalAccount: { upsert: upsertAccount },
            }),
        );
        mail.mockResolvedValue({ data: { id: "mail-1" }, error: null });

        const fetchSpy = jest.spyOn(global, "fetch").mockImplementation(async (input, init) => {
            const url = String(input);
            if (url.includes("/oauth2/v2.0/token")) {
                return jsonResponse({ access_token: "token" });
            }
            if (url.endsWith("/users") && init?.method === "POST") {
                const body = JSON.parse(String(init.body)) as {
                    userPrincipalName: string;
                };
                return jsonResponse(
                    { id: "graph-1", userPrincipalName: body.userPrincipalName },
                    201,
                );
            }
            if (url.endsWith("/assignLicense") && init?.method === "POST") {
                return jsonResponse({ id: "graph-1" });
            }
            throw new Error(`unexpected ${init?.method ?? "GET"} ${url}`);
        });

        const result = await provisionMicrosoft365Account({
            organizationId: "org-1",
            workerId: "worker-1",
            config,
            senderAddress: "hr@firma.de",
        });

        expect(result).toEqual({
            status: "created",
            workEmail: "ada.lovelace@firma.de",
            externalId: "graph-1",
            passwordMailSent: true,
        });
        expect(updateWorker).toHaveBeenCalledWith({
            where: { id: "worker-1" },
            data: { microsoftEmail: "ada.lovelace@firma.de" },
        });
        expect(upsertAccount).toHaveBeenCalledWith(
            expect.objectContaining({
                create: expect.objectContaining({
                    workerId: "worker-1",
                    provider: "microsoft_365",
                    externalId: "graph-1",
                }),
            }),
        );
        expect(mail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "ada@personal.test",
                senderAddress: "hr@firma.de",
                subject: "Dein Microsoft-365-Zugang",
            }),
        );
        expect(mail.mock.calls[0][0]).not.toHaveProperty("via");
        const mailed = mail.mock.calls[0][0] as { text: string };
        expect(mailed.text).toContain("ada.lovelace@firma.de");
        expect(mailed.text).toContain(
            "https://www.office.com/login?login_hint=ada.lovelace%40firma.de",
        );
        expect(mailed.text).toMatch(/Temporäres Passwort: .+/);
        fetchSpy.mockRestore();
    });

    it.each([204, 403, 500, "network-error"])(
        "checks account cleanup after licensing fails (%s)",
        async (deleteOutcome) => {
            configureEnv();
            findWorker.mockResolvedValue({
                id: "worker-1", firstName: "Ada", lastName: "Lovelace",
                email: "ada@personal.test", workEmail: null, externalAccounts: [],
            });
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
            const fetchSpy = jest.spyOn(global, "fetch")
                .mockResolvedValueOnce(jsonResponse({ access_token: "token" }))
                .mockResolvedValueOnce(jsonResponse({ id: "graph-1", userPrincipalName: "ada.lovelace@firma.de" }, 201))
                .mockResolvedValueOnce(jsonResponse({ error: "license rejected" }, 403));
            if (deleteOutcome === "network-error") {
                fetchSpy.mockRejectedValueOnce(new Error("connection lost"));
            } else {
                fetchSpy.mockResolvedValueOnce(jsonResponse(null, Number(deleteOutcome)));
            }
            try {
                const result = await provisionMicrosoft365Account({ organizationId: "org-1", workerId: "worker-1", config });
                expect(result.status).toBe("failed");
                if (result.status !== "failed") throw new Error("Expected failure");
                expect(fetchSpy).toHaveBeenNthCalledWith(4,
                    "https://graph.microsoft.com/v1.0/users/graph-1",
                    expect.objectContaining({ method: "DELETE" }));
                if (deleteOutcome === 204) {
                    expect(result.message).toBe("Microsoft Graph hat die Lizenz abgelehnt.");
                } else {
                    expect(result.message).toContain("Löschung");
                    expect(result.message).toContain("nicht bestätigt");
                    expect(result.message).toContain("graph-1");
                    expect(result.message).toContain("ada.lovelace@firma.de");
                }
                expect(transaction).not.toHaveBeenCalled();
                expect(mail).not.toHaveBeenCalled();
            } finally {
                fetchSpy.mockRestore();
                consoleSpy.mockRestore();
            }
        },
    );

    it("keeps the account when the password mail fails", async () => {
        configureEnv();
        findWorker.mockResolvedValue({
            id: "worker-1",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@personal.test",
            workEmail: null,
            externalAccounts: [],
        });
        const updateWorker = jest.fn();
        transaction.mockImplementation(async (run: (tx: unknown) => unknown) =>
            run({
                worker: { update: updateWorker },
                workerExternalAccount: { upsert: jest.fn() },
            }),
        );
        mail.mockResolvedValue({
            data: null,
            error: { name: "MailError", message: "rejected" },
        });
        const fetchSpy = jest.spyOn(global, "fetch").mockImplementation(async (input, init) => {
            const url = String(input);
            if (url.includes("/oauth2/v2.0/token")) {
                return jsonResponse({ access_token: "token" });
            }
            if (url.endsWith("/users") && init?.method === "POST") {
                return jsonResponse(
                    { id: "graph-1", userPrincipalName: "ada.lovelace@firma.de" },
                    201,
                );
            }
            if (url.endsWith("/assignLicense")) return jsonResponse({});
            throw new Error(`unexpected ${url}`);
        });

        const result = await provisionMicrosoft365Account({
            organizationId: "org-1",
            workerId: "worker-1",
            config,
        });

        expect(result).toMatchObject({
            status: "created",
            workEmail: "ada.lovelace@firma.de",
            passwordMailSent: false,
        });
        expect(updateWorker).toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    it("numbers the work address when Microsoft already has that sign-in name", async () => {
        configureEnv();
        findWorker.mockResolvedValue({
            id: "worker-1",
            firstName: "Maddox",
            lastName: "Sciuchetti",
            email: "maddox@personal.test",
            microsoftEmail: null,
            externalAccounts: [],
        });
        const updateWorker = jest.fn();
        transaction.mockImplementation(async (run: (tx: unknown) => unknown) =>
            run({
                worker: { update: updateWorker },
                workerExternalAccount: { upsert: jest.fn() },
            }),
        );
        mail.mockResolvedValue({ data: { id: "mail-1" }, error: null });
        const createdAddresses: string[] = [];
        const fetchSpy = jest.spyOn(global, "fetch").mockImplementation(async (input, init) => {
            const url = String(input);
            if (url.includes("/oauth2/v2.0/token")) {
                return jsonResponse({ access_token: "token" });
            }
            if (url.endsWith("/users") && init?.method === "POST") {
                const body = JSON.parse(String(init.body)) as {
                    userPrincipalName: string;
                };
                createdAddresses.push(body.userPrincipalName);
                if (createdAddresses.length === 1) {
                    return jsonResponse(
                        {
                            error: {
                                code: "Request_BadRequest",
                                message:
                                    "Another object with the same value for property userPrincipalName already exists.",
                                details: [
                                    {
                                        code: "ObjectConflict",
                                        message:
                                            "Another object with the same value for property userPrincipalName already exists.",
                                        target: "userPrincipalName",
                                    },
                                ],
                            },
                        },
                        400,
                    );
                }
                return jsonResponse(
                    { id: "graph-2", userPrincipalName: body.userPrincipalName },
                    201,
                );
            }
            if (url.endsWith("/assignLicense") && init?.method === "POST") {
                return jsonResponse({ id: "graph-2" });
            }
            throw new Error(`unexpected ${init?.method ?? "GET"} ${url}`);
        });

        const result = await provisionMicrosoft365Account({
            organizationId: "org-1",
            workerId: "worker-1",
            config,
        });

        expect(createdAddresses).toEqual([
            "maddox.sciuchetti@firma.de",
            "maddox.sciuchetti2@firma.de",
        ]);
        expect(result).toMatchObject({
            status: "created",
            workEmail: "maddox.sciuchetti2@firma.de",
            externalId: "graph-2",
        });
        expect(updateWorker).toHaveBeenCalledWith({
            where: { id: "worker-1" },
            data: { microsoftEmail: "maddox.sciuchetti2@firma.de" },
        });
        fetchSpy.mockRestore();
    });

    it("does not create another user when the account already exists", async () => {
        configureEnv();
        findWorker.mockResolvedValue({
            id: "worker-1",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@personal.test",
            microsoftEmail: "ada.lovelace@firma.de",
            workEmail: "ada@other-employer.test",
            externalAccounts: [{ externalId: "graph-1" }],
        });
        const fetchSpy = jest
            .spyOn(global, "fetch")
            .mockRejectedValue(new Error("should not call"));

        const result = await provisionMicrosoft365Account({
            organizationId: "org-1",
            workerId: "worker-1",
            config,
        });

        expect(result).toEqual({
            status: "skipped",
            reason: "already_provisioned",
            workEmail: "ada.lovelace@firma.de",
        });
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(transaction).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });
});

it.each([
    [7000222, 'abgelaufen'],
    [7000215, 'Secret-Wert'],
    [7000218, 'Secret-Wert'],
    [700016, 'Client-ID und Mandanten-ID'],
    [90002, 'Mandanten-ID'],
    [65001, 'Administratorzustimmung'],
])("returns actionable app authentication diagnostics for AADSTS %s", async (code, expected) => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(jsonResponse({
        error: "invalid_client", error_codes: [code], error_description: "private tenant detail",
    }, 401));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
        const onError = jest.fn();
        expect(await microsoftGraphToken(config, onError)).toBeNull();
        expect(onError).toHaveBeenCalledWith(expect.stringContaining(expected));
        expect(onError).toHaveBeenCalledWith(expect.stringContaining("persönliche Microsoft-Anmeldung"));
        expect(onError.mock.calls[0][0]).not.toContain("private tenant detail");
    } finally {
        fetchSpy.mockRestore();
        consoleSpy.mockRestore();
    }
});
it("suggests retrying a temporary Microsoft outage instead of changing credentials", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ error: "server_error" }, 503));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
        const onError = jest.fn();
        expect(await microsoftGraphToken(config, onError)).toBeNull();
        expect(onError).toHaveBeenCalledWith(expect.stringContaining("erneut versuchen"));
        expect(onError.mock.calls[0][0]).not.toContain("Client-Secret");
    } finally {
        fetchSpy.mockRestore();
        consoleSpy.mockRestore();
    }
});
