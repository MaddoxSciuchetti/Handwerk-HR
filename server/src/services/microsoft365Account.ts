import { integrationsLive } from "@/services/integrations/runtime";
import { createMicrosoft365GraphClient } from "./microsoft365/graphClient";
import { temporaryPassword } from "./microsoft365/identity";
import { sendPasswordMail } from "./microsoft365/passwordMail";
import { createMicrosoft365Provisioner } from "./microsoft365/provision";
import { microsoft365Repository } from "./microsoft365/repository";
import type { Microsoft365Config } from "./microsoft365/types";

// Keep the existing entry points stable for task automation and offboarding.
export { buildUserPrincipalName, foldMailPart } from "./microsoft365/identity";
export { microsoft365AutomationStatus } from "./microsoft365/status";
export type {
    Microsoft365AutomationStatus,
    ProvisionMicrosoft365Result,
} from "./microsoft365/types";

const graph = createMicrosoft365GraphClient();

export function microsoftGraphToken(config: Microsoft365Config | null) {
    return graph.getToken(config);
}

export const provisionMicrosoft365Account = createMicrosoft365Provisioner({
    repository: microsoft365Repository,
    graph,
    isLive: integrationsLive,
    generatePassword: temporaryPassword,
    sendPasswordMail,
});
