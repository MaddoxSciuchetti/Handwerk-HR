import type { Microsoft365EnvKey } from "@/constants/env";

export type Microsoft365AutomationStatus = {
    id: "microsoft-365";
    name: string;
    description: string;
    configured: boolean;
    missing: Microsoft365EnvKey[];
    permissions: readonly string[];
};

export type ProvisionMicrosoft365Result =
    | { status: "skipped"; reason: "not_configured" | "not_live" }
    | {
          status: "skipped";
          reason: "already_provisioned";
          workEmail: string;
      }
    | {
          status: "created";
          workEmail: string;
          externalId: string;
          passwordMailSent: boolean;
      }
    | { status: "failed"; message: string };

export type Microsoft365Config = {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    domain: string;
    licenseSkuId: string;
};

export type GraphUser = {
    id?: unknown;
    userPrincipalName?: unknown;
};

export type WorkerIdentity = { firstName: string; lastName: string };

export type UserPrincipalNameInput = WorkerIdentity & {
    domain: string;
    attempt: number;
};

export type CreateGraphUserInput = WorkerIdentity & {
    token: string;
    config: Microsoft365Config;
    password: string;
};

export type CreateGraphUserResult =
    | { ok: true; externalId: string; workEmail: string }
    | { ok: false; message: string };

export type AssignLicenseInput = {
    token: string;
    externalId: string;
    licenseSkuId: string;
};

export type PasswordMailInput = {
    firstName: string;
    workEmail: string;
    password: string;
};

export type PasswordMail = { subject: string; text: string; html: string };

export type ProvisionMicrosoft365Input = {
    organizationId: string;
    workerId: string;
    config: Microsoft365Config | null;
};

export type ProvisioningWorker = WorkerIdentity & {
    id: string;
    email: string;
    workEmail: string | null;
    externalAccounts: { externalId: string }[];
};

export type ProvisioningRepository = {
    findWorker: (
        organizationId: string,
        workerId: string,
    ) => Promise<ProvisioningWorker | null>;
    saveAccount: (
        workerId: string,
        account: { externalId: string; workEmail: string },
    ) => Promise<void>;
};

export type Microsoft365GraphClient = {
    getToken: (config: Microsoft365Config | null) => Promise<string | null>;
    createUser: (input: CreateGraphUserInput) => Promise<CreateGraphUserResult>;
    assignLicense: (input: AssignLicenseInput) => Promise<boolean>;
    deleteUser: (token: string, externalId: string) => Promise<boolean>;
};

export type ProvisioningDependencies = {
    repository: ProvisioningRepository;
    graph: Microsoft365GraphClient;
    isLive: () => boolean;
    generatePassword: () => string;
    sendPasswordMail: (
        input: PasswordMailInput & { to: string },
    ) => Promise<boolean>;
};
