import {
    cronError,
    cronInfo,
    cronWarn,
    serializeCronError,
} from "./cronLog";

describe("serializeCronError", () => {
    it("keeps Error name, message, and stack", () => {
        const error = new Error("mail transport down");
        error.name = "MailError";
        expect(serializeCronError(error)).toEqual({
            name: "MailError",
            message: "mail transport down",
            stack: error.stack,
        });
    });

    it("serializes plain objects with a message", () => {
        expect(
            serializeCronError({ name: "ResendError", message: "rate limited" }),
        ).toEqual({
            name: "ResendError",
            message: "rate limited",
        });
    });

    it("stringifies unknown values", () => {
        expect(serializeCronError("boom")).toEqual({
            name: "Error",
            message: "boom",
        });
    });
});

describe("cronLog helpers", () => {
    it("emits a searchable job tag plus structured fields", () => {
        const info = jest.spyOn(console, "info").mockImplementation();
        const warn = jest.spyOn(console, "warn").mockImplementation();
        const error = jest.spyOn(console, "error").mockImplementation();

        cronInfo("anniversary-reminder", {
            event: "run_complete",
            outcome: "ok",
            processed: 1,
        });
        cronWarn("anniversary-reminder", {
            event: "org_skipped",
            reason: "no_active_members",
        });
        cronError("scheduled-deactivation", {
            event: "task_failed",
            outcome: "failed",
            issueId: "issue-1",
            error: serializeCronError(new Error("Timeout")),
        });

        expect(info).toHaveBeenCalledWith("anniversary-reminder", {
            job: "anniversary-reminder",
            event: "run_complete",
            outcome: "ok",
            processed: 1,
        });
        expect(warn).toHaveBeenCalledWith("anniversary-reminder", {
            job: "anniversary-reminder",
            event: "org_skipped",
            reason: "no_active_members",
        });
        expect(error).toHaveBeenCalledWith(
            "scheduled-deactivation",
            expect.objectContaining({
                job: "scheduled-deactivation",
                event: "task_failed",
                outcome: "failed",
                issueId: "issue-1",
                error: expect.objectContaining({
                    name: "Error",
                    message: "Timeout",
                }),
            }),
        );

        info.mockRestore();
        warn.mockRestore();
        error.mockRestore();
    });
});
