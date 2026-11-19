import { withCronSentryCheckIn } from "./withCronSentryCheckIn";

const captureCheckIn = jest.fn();

jest.mock("@/instrument", () => ({
    isSentryEnabled: false,
}));

jest.mock("@sentry/node", () => ({
    captureCheckIn: (...args: unknown[]) => captureCheckIn(...args),
}));

it("skips Sentry when the DSN is not set", async () => {
    const result = await withCronSentryCheckIn(
        {
            monitorSlug: "anniversary-reminders",
            schedule: "0 6 * * *",
        },
        async () => "done",
    );

    expect(result).toBe("done");
    expect(captureCheckIn).not.toHaveBeenCalled();
});
