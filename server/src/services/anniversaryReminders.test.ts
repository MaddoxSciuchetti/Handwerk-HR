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

function worker(overrides: Record<string, unknown> = {}) {
    return {
        id: "worker-1",
        organizationId: "org-1",
        firstName: "Ada",
        lastName: "Beispiel",
        entryDate: new Date("2021-10-21T00:00:00.000Z"),
        exitDate: null,
        engagements: [{ type: "transfer", status: "completed" }],
        ...overrides,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe("findDueAnniversariesForWorkers", () => {
    it("returns a milestone that falls on Berlin today", () => {
        const due = findDueAnniversariesForWorkers([worker()], today);
        expect(due).toEqual([
            expect.objectContaining({
                workerId: "worker-1",
                organizationId: "org-1",
                years: 5,
            }),
        ]);
        expect(due[0]?.anniversaryDate.toISOString().slice(0, 10)).toBe(
            "2026-10-21",
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
        const leapDay = new Date("2025-02-28T12:00:00.000Z");
        const due = findDueAnniversariesForWorkers(
            [
                worker({
                    entryDate: new Date("2020-02-29T00:00:00.000Z"),
                }),
            ],
            leapDay,
        );
        expect(due).toEqual([
            expect.objectContaining({ years: 5, workerId: "worker-1" }),
        ]);
        expect(due[0]?.anniversaryDate.toISOString().slice(0, 10)).toBe(
            "2025-02-28",
        );
    });

    it("ignores workers without a milestone today", () => {
        expect(
            findDueAnniversariesForWorkers(
                [worker({ entryDate: new Date("2021-10-20T00:00:00.000Z") })],
                today,
            ),
        ).toEqual([]);
    });
});

describe("runAnniversaryReminders", () => {
    it("returns zeros when nobody is due", async () => {
        (prisma.worker.findMany as jest.Mock).mockResolvedValue([]);
        await expect(runAnniversaryReminders(today)).resolves.toEqual({
            processed: 0,
            succeeded: 0,
            failed: 0,
        });
        expect(sendMail).not.toHaveBeenCalled();
    });

    it("emails active members and records sends", async () => {
        (prisma.worker.findMany as jest.Mock).mockResolvedValue([worker()]);
        (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([
            {
                user: {
                    id: "user-1",
                    email: "hr@example.com",
                    firstName: "Hans",
                    lastName: "Recruiter",
                },
            },
        ]);
        (prisma.anniversaryReminderSent.findMany as jest.Mock).mockResolvedValue(
            [],
        );
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
    });

    it("skips recipients who already received today's reminder", async () => {
        (prisma.worker.findMany as jest.Mock).mockResolvedValue([worker()]);
        (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([
            {
                user: {
                    id: "user-1",
                    email: "hr@example.com",
                    firstName: "Hans",
                    lastName: "Recruiter",
                },
            },
        ]);
        (prisma.anniversaryReminderSent.findMany as jest.Mock).mockResolvedValue(
            [
                {
                    workerId: "worker-1",
                    years: 5,
                    anniversaryDate: new Date("2026-10-21T00:00:00.000Z"),
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
    });

    it("counts mail failures without recording a send", async () => {
        (prisma.worker.findMany as jest.Mock).mockResolvedValue([worker()]);
        (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([
            {
                user: {
                    id: "user-1",
                    email: "hr@example.com",
                    firstName: "Hans",
                    lastName: "Recruiter",
                },
            },
        ]);
        (prisma.anniversaryReminderSent.findMany as jest.Mock).mockResolvedValue(
            [],
        );
        (sendMail as jest.Mock).mockResolvedValue({
            data: null,
            error: { name: "MailError", message: "boom" },
        });

        await expect(runAnniversaryReminders(today)).resolves.toEqual({
            processed: 1,
            succeeded: 0,
            failed: 1,
        });
        expect(prisma.anniversaryReminderSent.createMany).not.toHaveBeenCalled();
    });
});
