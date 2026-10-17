import type {
    ProvisionMicrosoft365Input,
    ProvisionMicrosoft365Result,
    ProvisioningDependencies,
} from "./types";

/** Orchestrates provisioning without importing database, mail, HTTP or environment clients. */
export function createMicrosoft365Provisioner(
    dependencies: ProvisioningDependencies,
) {
    return async function provisionMicrosoft365Account(
        params: ProvisionMicrosoft365Input,
    ): Promise<ProvisionMicrosoft365Result> {
        const config = params.config;
        if (!config) return { status: "skipped", reason: "not_configured" };

        const worker = await dependencies.repository.findWorker(
            params.organizationId,
            params.workerId,
        );
        if (!worker) {
            return { status: "failed", message: "Mitarbeiter nicht gefunden." };
        }

        const existing = worker.externalAccounts[0];
        if (existing) {
            return {
                status: "skipped",
                reason: "already_provisioned",
                workEmail: worker.workEmail ?? "",
            };
        }

        if (!dependencies.isLive()) {
            return { status: "skipped", reason: "not_live" };
        }

        const token = await dependencies.graph.getToken(config);
        if (!token) {
            return {
                status: "failed",
                message: "Microsoft Graph hat die Anmeldung abgelehnt.",
            };
        }

        const password = dependencies.generatePassword();
        const created = await dependencies.graph.createUser({
            token,
            config,
            firstName: worker.firstName,
            lastName: worker.lastName,
            password,
        });
        if (!created.ok) return { status: "failed", message: created.message };

        const licensed = await dependencies.graph.assignLicense({
            token,
            externalId: created.externalId,
            licenseSkuId: config.licenseSkuId,
        });
        if (!licensed) {
            await dependencies.graph.deleteUser(token, created.externalId);
            return {
                status: "failed",
                message: "Microsoft Graph hat die Lizenz abgelehnt.",
            };
        }

        await dependencies.repository.saveAccount(worker.id, {
            externalId: created.externalId,
            workEmail: created.workEmail,
        });
        const passwordMailSent = await dependencies.sendPasswordMail({
            to: worker.email,
            firstName: worker.firstName,
            workEmail: created.workEmail,
            password,
        });

        return {
            status: "created",
            workEmail: created.workEmail,
            externalId: created.externalId,
            passwordMailSent,
        };
    };
}
