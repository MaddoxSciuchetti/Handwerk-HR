import { withCronSentryCheckIn } from "./withCronSentryCheckIn";

const captureCheckIn = jest.fn();

jest.mock("@/instrument", () => ({
    isSentryEnabled: true,
}));

jest.mock("@sentry/node", () => ({
    captureCheckIn: (...args: unknown[]) => captureCheckIn(...args),
}));

beforeEach(() => {
    jest.clearAllMocks();
    captureCheckIn.mockReturnValueOnce("check-1");
});

it("sends in_progress then ok when the run succeeds", async () => {
    const result = await withCronSentryCheckIn(
        {
            monitorSlug: "anniversary-reminders",
            schedule: "0 6 * * *",
        },
        async () => ({ failed: 0 }),
        (data) => data.failed === 0,
    );

    expect(result).toEqual({ failed: 0 });
    expect(captureCheckIn).toHaveBeenNthCalledWith(
        1,
        { monitorSlug: "anniversary-reminders", status: "in_progress" },
        expect.objectContaining({
            schedule: { type: "crontab", value: "0 6 * * *" },
        }),
    );
    expect(captureCheckIn).toHaveBeenNthCalledWith(2, {
        checkInId: "check-1",
        monitorSlug: "anniversary-reminders",
        status: "ok",
    });
});

it("sends error when isOk is false", async () => {
    await withCronSentryCheckIn(
        {
            monitorSlug: "scheduled-deactivations",
            schedule: "*/5 * * * *",
        },
        async () => ({ failed: 2 }),
        (data) => data.failed === 0,
    );

    expect(captureCheckIn).toHaveBeenNthCalledWith(2, {
        checkInId: "check-1",
        monitorSlug: "scheduled-deactivations",
        status: "error",
    });
});

it("sends error and rethrows when the run throws", async () => {
    await expect(
        withCronSentryCheckIn(
            {
                monitorSlug: "anniversary-reminders",
                schedule: "0 6 * * *",
            },
            async () => {
                throw new Error("boom");
            },
        ),
    ).rejects.toThrow("boom");

    expect(captureCheckIn).toHaveBeenNthCalledWith(2, {
        checkInId: "check-1",
        monitorSlug: "anniversary-reminders",
        status: "error",
    });
});
