import type {
    IntegrationProvider,
    IntegrationSequence,
} from "@prisma/client";

export const INTEGRATION_PROVIDERS = [
    "microsoft_graph",
    "crewmeister",
] as const satisfies readonly IntegrationProvider[];

export const INTEGRATION_SEQUENCES = [
    "microsoft_create_account",
    "microsoft_send_onboarding_email",
    "microsoft_send_offboarding_email",
    "microsoft_send_email",
    "microsoft_deactivate_account",
    "crewmeister_create_account",
] as const satisfies readonly IntegrationSequence[];

export const SEQUENCE_PROVIDER: Record<
    IntegrationSequence,
    IntegrationProvider
> = {
    microsoft_create_account: "microsoft_graph",
    microsoft_send_onboarding_email: "microsoft_graph",
    microsoft_send_offboarding_email: "microsoft_graph",
    microsoft_send_email: "microsoft_graph",
    microsoft_deactivate_account: "microsoft_graph",
    crewmeister_create_account: "crewmeister",
};

export function sequenceMatchesProvider(
    provider: IntegrationProvider | null,
    sequence: IntegrationSequence | null,
) {
    if (!provider && !sequence) return true;
    if (!provider || !sequence) return false;
    return SEQUENCE_PROVIDER[sequence] === provider;
}
