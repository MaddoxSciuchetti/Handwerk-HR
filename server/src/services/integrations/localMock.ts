import { integrationsMockEnabled, nodeEnv } from "@/constants/env";

// Explicit opt-in for local development; never enabled in production or tests.
// Uses nodeEnv() / integrationsMockEnabled() so unit tests can flip flags mid-suite.
export function integrationsMocked() {
    return nodeEnv() === "development" && integrationsMockEnabled();
}

export const MOCK_AUTOMATION_DELAY_MS = 10_000;
export const mockMailboxes = [
    { email: "hr@example.test", label: "Personalabteilung · Demo", kind: "mailbox" as const },
];
export const mockGroups = [
    { id: "mock-team", displayName: "Team · Demo" },
];
export const mockChannels = [
    {
        teamId: "mock-team",
        channelId: "mock-channel",
        teamName: "Team · Demo",
        channelName: "Allgemein",
        label: "Team · Demo · Allgemein",
    },
];
