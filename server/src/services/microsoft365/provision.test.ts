import { createMicrosoft365Provisioner } from "./provision";
import type {
    Microsoft365Config,
    ProvisioningDependencies,
    ProvisioningWorker,
} from "./types";

const config: Microsoft365Config = {
    tenantId: "tenant",
    clientId: "client",
    clientSecret: "secret",
    domain: "firma.de",
    licenseSkuId: "f245ecc8-75af-4f8e-b61f-27d8114de5f3",
};
const worker: ProvisioningWorker = {
    id: "worker-1",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@personal.test",
    workEmail: null,
    externalAccounts: [],
};
const account = { externalId: "graph-1", workEmail: "ada.lovelace@firma.de" };
const input = { organizationId: "org-1", workerId: worker.id, config };

function setup() {
    const dependencies = {
        repository: {
            findWorker: jest
                .fn<
                    ReturnType<
                        ProvisioningDependencies["repository"]["findWorker"]
                    >,
                    Parameters<
                        ProvisioningDependencies["repository"]["findWorker"]
                    >
                >()
                .mockResolvedValue(worker),
            saveAccount: jest.fn().mockResolvedValue(undefined),
        },
        graph: {
            getToken: jest.fn().mockResolvedValue("token"),
            createUser: jest.fn().mockResolvedValue({ ok: true, ...account }),
            assignLicense: jest.fn().mockResolvedValue(true),
            deleteUser: jest.fn().mockResolvedValue(true),
        },
        isLive: jest.fn().mockReturnValue(true),
        generatePassword: jest.fn().mockReturnValue("temporary-password"),
        sendPasswordMail: jest.fn().mockResolvedValue(true),
    } satisfies ProvisioningDependencies;
    return {
        dependencies,
        provision: createMicrosoft365Provisioner(dependencies),
    };
}

it("creates and licenses the account before saving it and mailing the private address", async () => {
    const { dependencies: d, provision } = setup();
    expect(await provision(input)).toEqual({
        status: "created",
        ...account,
        passwordMailSent: true,
    });
    expect(d.repository.findWorker).toHaveBeenCalledWith("org-1", worker.id);
    expect(d.graph.createUser).toHaveBeenCalledWith({
        token: "token",
        config,
        firstName: "Ada",
        lastName: "Lovelace",
        password: "temporary-password",
    });
    expect(d.graph.assignLicense).toHaveBeenCalledWith({
        token: "token",
        externalId: account.externalId,
        licenseSkuId: config.licenseSkuId,
    });
    expect(d.repository.saveAccount).toHaveBeenCalledWith(worker.id, account);
    expect(d.sendPasswordMail).toHaveBeenCalledWith({
        to: worker.email,
        firstName: "Ada",
        workEmail: account.workEmail,
        password: "temporary-password",
    });
    expect(d.graph.createUser.mock.invocationCallOrder[0]).toBeLessThan(
        d.graph.assignLicense.mock.invocationCallOrder[0],
    );
    expect(d.graph.assignLicense.mock.invocationCallOrder[0]).toBeLessThan(
        d.repository.saveAccount.mock.invocationCallOrder[0],
    );
    expect(d.repository.saveAccount.mock.invocationCallOrder[0]).toBeLessThan(
        d.sendPasswordMail.mock.invocationCallOrder[0],
    );
});

it("does not read the database or call Microsoft without configuration", async () => {
    const { dependencies: d, provision } = setup();
    expect(await provision({ ...input, config: null })).toEqual({
        status: "skipped",
        reason: "not_configured",
    });
    expect(d.repository.findWorker).not.toHaveBeenCalled();
    expect(d.graph.getToken).not.toHaveBeenCalled();
});

it("does not provision a missing worker", async () => {
    const { dependencies: d, provision } = setup();
    d.repository.findWorker.mockResolvedValue(null);
    expect(await provision(input)).toEqual({
        status: "failed",
        message: "Mitarbeiter nicht gefunden.",
    });
    expect(d.graph.getToken).not.toHaveBeenCalled();
});

it("skips a locally linked account without sending a new password", async () => {
    const { dependencies: d, provision } = setup();
    d.repository.findWorker.mockResolvedValue({
        ...worker,
        workEmail: account.workEmail,
        externalAccounts: [{ externalId: account.externalId }],
    });
    expect(await provision(input)).toEqual({
        status: "skipped",
        reason: "already_provisioned",
        workEmail: account.workEmail,
    });
    expect(d.graph.getToken).not.toHaveBeenCalled();
    expect(d.sendPasswordMail).not.toHaveBeenCalled();
});

it("makes no external calls when live execution is disabled", async () => {
    const { dependencies: d, provision } = setup();
    d.isLive.mockReturnValue(false);
    expect(await provision(input)).toEqual({
        status: "skipped",
        reason: "not_live",
    });
    expect(d.graph.getToken).not.toHaveBeenCalled();
    expect(d.generatePassword).not.toHaveBeenCalled();
});

it("stops when authentication fails", async () => {
    const { dependencies: d, provision } = setup();
    d.graph.getToken.mockResolvedValue(null);
    expect(await provision(input)).toMatchObject({ status: "failed" });
    expect(d.graph.createUser).not.toHaveBeenCalled();
});

it("does not license, save or email a rejected account", async () => {
    const { dependencies: d, provision } = setup();
    d.graph.createUser.mockResolvedValue({ ok: false, message: "rejected" });
    expect(await provision(input)).toEqual({
        status: "failed",
        message: "rejected",
    });
    expect(d.graph.assignLicense).not.toHaveBeenCalled();
    expect(d.repository.saveAccount).not.toHaveBeenCalled();
    expect(d.sendPasswordMail).not.toHaveBeenCalled();
});

it("attempts to delete the created user when licensing fails and does not email credentials", async () => {
    const { dependencies: d, provision } = setup();
    d.graph.assignLicense.mockResolvedValue(false);
    expect(await provision(input)).toEqual({
        status: "failed",
        message: "Microsoft Graph hat die Lizenz abgelehnt.",
    });
    expect(d.graph.deleteUser).toHaveBeenCalledWith(
        "token",
        account.externalId,
    );
    expect(d.repository.saveAccount).not.toHaveBeenCalled();
    expect(d.sendPasswordMail).not.toHaveBeenCalled();
});

it("reports failure even when cleanup is rejected", async () => {
    const { dependencies: d, provision } = setup();
    d.graph.assignLicense.mockResolvedValue(false);
    d.graph.deleteUser.mockResolvedValue(false);
    expect(await provision(input)).toMatchObject({ status: "failed" });
    expect(d.repository.saveAccount).not.toHaveBeenCalled();
});

it("does not email credentials before the local account transaction succeeds", async () => {
    const { dependencies: d, provision } = setup();
    d.repository.saveAccount.mockRejectedValue(
        new Error("database unavailable"),
    );
    await expect(provision(input)).rejects.toThrow("database unavailable");
    expect(d.sendPasswordMail).not.toHaveBeenCalled();
});

it("retains the created account and exposes a failed password delivery", async () => {
    const { dependencies: d, provision } = setup();
    d.sendPasswordMail.mockResolvedValue(false);
    expect(await provision(input)).toEqual({
        status: "created",
        ...account,
        passwordMailSent: false,
    });
    expect(d.graph.deleteUser).not.toHaveBeenCalled();
});

it("does not retry user creation after a network failure with an unknown outcome", async () => {
    const { dependencies: d, provision } = setup();
    d.graph.createUser.mockRejectedValue(new Error("connection lost"));
    await expect(provision(input)).rejects.toThrow("connection lost");
    expect(d.graph.createUser).toHaveBeenCalledTimes(1);
    expect(d.sendPasswordMail).not.toHaveBeenCalled();
});
