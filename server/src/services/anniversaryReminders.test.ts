import {
    findDueAnniversariesForWorkers,
    runAnniversaryReminders,
} from "./anniversaryReminders";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/utils/sendMail";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        worker: { findMany: jest.fn() },
        organizationMember: { findMany: jest.fn() },
        anniversaryReminderSent: {
            findMany: jest.fn(),
            createMany: jest.fn(),
        },
    },
}));
jest.mock("@/utils/sendMail", () => ({ sendMail: jest.fn() }));
jest.mock("@/constants/env", () => ({
    APP_ORIGIN: "https://app.example",
    FRONTENDURL: "https://app.example",
    CRON_SECRET: () => "cron-secret",
}));

const today = new Date("2026-10-21T12:00:00.000Z");
const berlinDay = "2026-10-21";
/** 5-year milestone on 2026-10-28 → reminder fires 7 days earlier on today. */
const dueEntryDate = new Date("2021-10-28T00:00:00.000Z");

function worker(overrides: Record<string, unknown> = {}) {
    return {
        id: "worker-1",
        organizationId: "org-1",
        firstName: "Ada",
        lastName: "Beispiel",
        entryDate: dueEntryDate,
        exitDate: null,
        engagements: [{ type: "transfer", status: "completed" }],
        ...overrides,
    };
}

function member(
    overrides: Record<string, unknown> = {},
): { user: Record<string, unknown> } {
    return {
        user: {
            id: "user-1",
            email: "hr@example.com",
            firstName: "Hans",
            lastName: "Recruiter",
            ...overrides,
        },
    };
}

function mockDueWorkerReady() {
    (prisma.worker.findMany as jest.Mock).mockResolvedValue([worker()]);
    (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([
        member(),
    ]);
    (prisma.anniversaryReminderSent.findMany as jest.Mock).mockResolvedValue(
        [],
    );
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe("findDueAnniversariesForWorkers", () => {
    it("returns a milestone that falls one week after Berlin today", () => {
        const due = findDueAnniversariesForWorkers([worker()], today);
        expect(due).toEqual([
            expect.objectContaining({
                workerId: "worker-1",
                organizationId: "org-1",
                years: 5,
            }),
        ]);
        expect(due[0]?.anniversaryDate.toISOString().slice(0, 10)).toBe(
            "2026-10-28",
        );
    });

    it("skips in-progress onboarding, offboarding, and exited workers", () => {
        expect(
            findDueAnniversariesForWorkers(
                [
                    worker({
                        id: "onboarding",
                        engagements: [
                            { type: "onboarding", status: "in_progress" },
                        ],
                    }),
                    worker({
                        id: "offboarding",
                        engagements: [
                            { type: "offboarding", status: "completed" },
                        ],
                    }),
                    worker({
                        id: "left",
                        exitDate: new Date("2026-10-20T00:00:00.000Z"),
                    }),
                ],
                today,
            ),
        ).toEqual([]);
    });

    it("includes completed onboarding", () => {
        const due = findDueAnniversariesForWorkers(
            [
                worker({
                    engagements: [
                        { type: "onboarding", status: "completed" },
                    ],
                }),
            ],
            today,
        );
        expect(due).toHaveLength(1);
    });

    it("maps Feb 29 entry to Feb 28 in a non-leap anniversary year", () => {
        const reminderDay = new Date("2025-02-21T12:00:00.000Z");
        const due = findDueAnniversariesForWorkers(
            [
                worker({
                    entryDate: new Date("2020-02-29T00:00:00.000Z"),
                }),
            ],
            reminderDay,
        );
        expect(due).toEqual([
            expect.objectContaining({ years: 5, workerId: "worker-1" }),
        ]);
        expect(due[0]?.anniversaryDate.toISOString().slice(0, 10)).toBe(
            "2025-02-28",
        );
    });

    it("ignores workers whose milestone is not one week away", () => {
        expect(
            findDueAnniversariesForWorkers(
                [worker({ entryDate: new Date("2021-10-21T00:00:00.000Z") })],
                today,
            ),
        ).toEqual([]);
    });
});

describe("runAnniversaryReminders", () => {
    let info: jest.SpyInstance;
    let warn: jest.SpyInstance;
    let error: jest.SpyInstance;

    beforeEach(() => {
        info = jest.spyOn(console, "info").mockImplementation();
        warn = jest.spyOn(console, "warn").mockImplementation();
        error = jest.spyOn(console, "error").mockImplementation();
    });

    afterEach(() => {
        info.mockRestore();
        warn.mockRestore();
        error.mockRestore();
    });

    it("returns zeros when nobody is due and logs an idle run summary", async () => {
        (prisma.worker.findMany as jest.Mock).mockResolvedValue([]);
        await expect(runAnniversaryReminders(today)).resolves.toEqual({
            processed: 0,
            succeeded: 0,
            failed: 0,
        });
        expect(sendMail).not.toHaveBeenCalled();
        expect(info).toHaveBeenCalledWith("anniversary-reminder", {
            job: "anniversary-reminder",
            event: "run_complete",
            outcome: "ok",
            berlinDay,
            dueCount: 0,
            processed: 0,
            succeeded: 0,
            failed: 0,
        });
    });

    it("emails active members, records sends, and links to Handwerker", async () => {
        mockDueWorkerReady();
        (sendMail as jest.Mock).mockResolvedValue({
            data: { id: "mail-1" },
            error: null,
        });
        (prisma.anniversaryReminderSent.createMany as jest.Mock).mockResolvedValue(
            { count: 1 },
        );

        await expect(runAnniversaryReminders(today)).resolves.toEqual({
            processed: 1,
            succeeded: 1,
            failed: 0,
        });
        expect(sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "hr@example.com",
                via: "resend",
                subject: expect.stringContaining("Ada Beispiel"),
            }),
        );
        const mailed = (sendMail as jest.Mock).mock.calls[0][0];
        expect(mailed.html).toContain("/worker-lifycycle");
        expect(mailed.html).toContain("Zum Handwerker");
        expect(mailed.text).toContain("/worker-lifycycle");
        expect(prisma.anniversaryReminderSent.createMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: [
                    expect.objectContaining({
                        organizationId: "org-1",
                        workerId: "worker-1",
                        years: 5,
                        recipientUserId: "user-1",
                    }),
                ],
                skipDuplicates: true,
            }),
        );
        expect(info).toHaveBeenCalledWith(
            "anniversary-reminder",
            expect.objectContaining({
                event: "send_succeeded",
                outcome: "ok",
                organizationId: "org-1",
                recipientUserId: "user-1",
                recipientEmail: "hr@example.com",
                workers: [{ workerId: "worker-1", years: 5 }],
                actionUrl: "https://app.example/worker-lifycycle",
            }),
        );
        expect(info).toHaveBeenCalledWith(
            "anniversary-reminder",
            expect.objectContaining({
                event: "run_complete",
                outcome: "ok",
                dueCount: 1,
                processed: 1,
                succeeded: 1,
                failed: 0,
            }),
        );
        expect(error).not.toHaveBeenCalled();
    });

    it("skips recipients who already received today's reminder", async () => {
        mockDueWorkerReady();
        (prisma.anniversaryReminderSent.findMany as jest.Mock).mockResolvedValue(
            [
                {
                    workerId: "worker-1",
                    years: 5,
                    anniversaryDate: new Date("2026-10-28T00:00:00.000Z"),
                    recipientUserId: "user-1",
                },
            ],
        );

        await expect(runAnniversaryReminders(today)).resolves.toEqual({
            processed: 0,
            succeeded: 0,
            failed: 0,
        });
        expect(sendMail).not.toHaveBeenCalled();
        expect(info).toHaveBeenCalledWith(
            "anniversary-reminder",
            expect.objectContaining({
                event: "run_complete",
                outcome: "ok",
                processed: 0,
                failed: 0,
            }),
        );
    });

    it("logs a clear send_failed event with serialized error details", async () => {
        mockDueWorkerReady();
        (sendMail as jest.Mock).mockResolvedValue({
            data: null,
            error: { name: "MailError", message: "resend rejected" },
        });

        await expect(runAnniversaryReminders(today)).resolves.toEqual({
            processed: 1,
            succeeded: 0,
            failed: 1,
        });
        expect(prisma.anniversaryReminderSent.createMany).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalledWith("anniversary-reminder", {
            job: "anniversary-reminder",
            event: "send_failed",
            outcome: "failed",
            stage: "send_mail",
            organizationId: "org-1",
            berlinDay,
            recipientUserId: "user-1",
            recipientEmail: "hr@example.com",
            workers: [{ workerId: "worker-1", years: 5 }],
            error: {
                name: "Error",
                message: "resend rejected",
                stack: expect.any(String),
            },
        });
        expect(info).toHaveBeenCalledWith(
            "anniversary-reminder",
            expect.objectContaining({
                event: "run_complete",
                outcome: "failed",
                failed: 1,
            }),
        );
    });

    it("logs record_sent_failed when mail succeeded but dedupe write fails", async () => {
        mockDueWorkerReady();
        (sendMail as jest.Mock).mockResolvedValue({
            data: { id: "mail-1" },
            error: null,
        });
        (prisma.anniversaryReminderSent.createMany as jest.Mock).mockRejectedValue(
            new Error("unique constraint"),
        );

        await expect(runAnniversaryReminders(today)).resolves.toEqual({
            processed: 1,
            succeeded: 0,
            failed: 1,
        });
        expect(error).toHaveBeenCalledWith(
            "anniversary-reminder",
            expect.objectContaining({
                event: "record_sent_failed",
                outcome: "failed",
                stage: "record_sent",
                recipientEmail: "hr@example.com",
                error: expect.objectContaining({
                    name: "Error",
                    message: "unique constraint",
                }),
            }),
        );
    });

    it("warns when an org has due jubilees but no active members", async () => {
        (prisma.worker.findMany as jest.Mock).mockResolvedValue([worker()]);
        (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([]);

        await expect(runAnniversaryReminders(today)).resolves.toEqual({
            processed: 0,
            succeeded: 0,
            failed: 0,
        });
        expect(sendMail).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith("anniversary-reminder", {
            job: "anniversary-reminder",
            event: "org_skipped",
            reason: "no_active_members",
            organizationId: "org-1",
            berlinDay,
            workers: [{ workerId: "worker-1", years: 5 }],
        });
    });

    it("isolates one recipient failure while continuing other members", async () => {
        (prisma.worker.findMany as jest.Mock).mockResolvedValue([worker()]);
        (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([
            member({ id: "user-1", email: "fail@example.com" }),
            member({
                id: "user-2",
                email: "ok@example.com",
                firstName: "Olga",
                lastName: "Ok",
            }),
        ]);
        (prisma.anniversaryReminderSent.findMany as jest.Mock).mockResolvedValue(
            [],
        );
        (sendMail as jest.Mock)
            .mockResolvedValueOnce({
                data: null,
                error: { message: "mailbox full" },
            })
            .mockResolvedValueOnce({ data: { id: "mail-2" }, error: null });
        (prisma.anniversaryReminderSent.createMany as jest.Mock).mockResolvedValue(
            { count: 1 },
        );

        await expect(runAnniversaryReminders(today)).resolves.toEqual({
            processed: 2,
            succeeded: 1,
            failed: 1,
        });
        expect(error).toHaveBeenCalledWith(
            "anniversary-reminder",
            expect.objectContaining({
                event: "send_failed",
                recipientEmail: "fail@example.com",
                error: expect.objectContaining({ message: "mailbox full" }),
            }),
        );
        expect(info).toHaveBeenCalledWith(
            "anniversary-reminder",
            expect.objectContaining({
                event: "send_succeeded",
                recipientEmail: "ok@example.com",
            }),
        );
        expect(info).toHaveBeenCalledWith(
            "anniversary-reminder",
            expect.objectContaining({
                event: "run_complete",
                outcome: "failed",
                processed: 2,
                succeeded: 1,
                failed: 1,
            }),
        );
    });

    it("logs load_members_failed when member lookup throws", async () => {
        (prisma.worker.findMany as jest.Mock).mockResolvedValue([worker()]);
        (prisma.organizationMember.findMany as jest.Mock).mockRejectedValue(
            new Error("db down"),
        );

        await expect(runAnniversaryReminders(today)).resolves.toEqual({
            processed: 1,
            succeeded: 0,
            failed: 1,
        });
        expect(error).toHaveBeenCalledWith(
            "anniversary-reminder",
            expect.objectContaining({
                event: "load_members_failed",
                outcome: "failed",
                organizationId: "org-1",
                error: expect.objectContaining({ message: "db down" }),
            }),
        );
    });
});
