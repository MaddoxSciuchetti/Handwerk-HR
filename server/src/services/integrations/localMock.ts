// Explicit opt-in for local development; never enabled in production or tests.
export function integrationsMocked() {
    return process.env.NODE_ENV === "development" &&
        process.env.INTEGRATIONS_MOCK === "true";
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
