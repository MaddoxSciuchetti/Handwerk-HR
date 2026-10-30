import { randomUUID } from "node:crypto";
import { berlinToday, calendarDayUtc } from "../../../shared/calendarDate";
import {
    dueCompanyAnniversary,
    type CompanyAnniversary,
} from "../../../shared/companyAnniversary";
import { isTeamMember } from "../../../shared/teamMembers";
import { APP_ORIGIN, FRONTENDURL } from "@/constants/env";
import { prisma } from "@/lib/prisma";
import {
    cronError,
    cronInfo,
    cronWarn,
    serializeCronError,
} from "@/utils/cronLog";
import { getAnniversaryReminderTemplate } from "@/utils/emailTemplates";
import { sendMail } from "@/utils/sendMail";

const JOB = "anniversary-reminder";

export type DueAnniversary = {
    organizationId: string;
    workerId: string;
    firstName: string;
    lastName: string;
    years: CompanyAnniversary["years"];
    anniversaryDate: Date;
};

function entryDateIso(value: Date): string {
    return value.toISOString().slice(0, 10);
}

function exitDateIso(value: Date | null): string | null {
    return value ? entryDateIso(value) : null;
}

function handwerkerActionUrl() {
    const origin =
        FRONTENDURL.replace(/\/$/, "") ||
        APP_ORIGIN.split(",")[0]?.trim().replace(/\/$/, "") ||
        "";
    return `${origin}/worker-lifycycle`;
}

export function findDueAnniversariesForWorkers(
    workers: Array<{
        id: string;
        organizationId: string;
        firstName: string;
        lastName: string;
        entryDate: Date | null;
        exitDate: Date | null;
        engagements: Array<{ type: string; status: string }>;
    }>,
    today = new Date(),
): DueAnniversary[] {
    const day = calendarDayUtc(berlinToday(today));
    const due: DueAnniversary[] = [];

    for (const worker of workers) {
        if (!worker.entryDate) continue;
        const entryDate = entryDateIso(worker.entryDate);
        if (
            !isTeamMember(
                {
                    firstName: worker.firstName,
                    lastName: worker.lastName,
                    exitDate: exitDateIso(worker.exitDate),
                    engagements: worker.engagements,
                },
                day,
            )
        ) {
            continue;
        }
        const anniversary = dueCompanyAnniversary(entryDate, day);
        if (!anniversary) continue;
        due.push({
            organizationId: worker.organizationId,
            workerId: worker.id,
            firstName: worker.firstName,
            lastName: worker.lastName,
            years: anniversary.years,
            anniversaryDate: anniversary.date,
        });
    }

    return due;
}

async function loadCandidateWorkers() {
    return prisma.worker.findMany({
        where: { entryDate: { not: null } },
        select: {
            id: true,
            organizationId: true,
            firstName: true,
            lastName: true,
            entryDate: true,
            exitDate: true,
            engagements: {
                orderBy: { createdAt: "desc" },
                select: { type: true, status: true },
                take: 1,
            },
        },
    });
}

async function loadActiveMembers(organizationId: string) {
    const members = await prisma.organizationMember.findMany({
        where: {
            organizationId,
            status: "active",
            user: { status: "active" },
        },
        select: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
    });
    return members.map((member) => member.user);
}

function personName(person: { firstName: string; lastName: string }) {
    return `${person.firstName} ${person.lastName}`.trim();
}

export async function runAnniversaryReminders(now = new Date()) {
    const berlinDay = berlinToday(now);
    const due = findDueAnniversariesForWorkers(
        await loadCandidateWorkers(),
        now,
    );
    if (!due.length) {
        const summary = { processed: 0, succeeded: 0, failed: 0 };
        cronInfo(JOB, {
            event: "run_complete",
            outcome: "ok",
            berlinDay,
            dueCount: 0,
            ...summary,
        });
        return summary;
    }

    const byOrg = new Map<string, DueAnniversary[]>();
    for (const item of due) {
        const list = byOrg.get(item.organizationId) ?? [];
        list.push(item);
        byOrg.set(item.organizationId, list);
    }

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const actionUrl = handwerkerActionUrl();

    for (const [organizationId, anniversaries] of byOrg) {
        const workers = anniversaries.map((item) => ({
            workerId: item.workerId,
            years: item.years,
        }));
        let members;
        try {
            members = await loadActiveMembers(organizationId);
        } catch (error) {
            failed += 1;
            processed += 1;
            cronError(JOB, {
                event: "load_members_failed",
                outcome: "failed",
                organizationId,
                berlinDay,
                workers,
                error: serializeCronError(error),
            });
            continue;
        }
        if (!members.length) {
            cronWarn(JOB, {
                event: "org_skipped",
                reason: "no_active_members",
                organizationId,
                berlinDay,
                workers,
            });
            continue;
        }

        let alreadySent;
        try {
            alreadySent = await prisma.anniversaryReminderSent.findMany({
                where: {
                    organizationId,
                    OR: anniversaries.map((item) => ({
                        workerId: item.workerId,
                        years: item.years,
                        anniversaryDate: item.anniversaryDate,
                    })),
                },
                select: {
                    workerId: true,
                    years: true,
                    anniversaryDate: true,
                    recipientUserId: true,
                },
            });
        } catch (error) {
            failed += 1;
            processed += 1;
            cronError(JOB, {
                event: "load_sent_failed",
                outcome: "failed",
                organizationId,
                berlinDay,
                workers,
                error: serializeCronError(error),
            });
            continue;
        }
        const sentKeys = new Set(
            alreadySent.map(
                (row) =>
                    `${row.recipientUserId}:${row.workerId}:${row.years}:${row.anniversaryDate.toISOString().slice(0, 10)}`,
            ),
        );

        for (const member of members) {
            const pending = anniversaries.filter(
                (item) =>
                    !sentKeys.has(
                        `${member.id}:${item.workerId}:${item.years}:${item.anniversaryDate.toISOString().slice(0, 10)}`,
                    ),
            );
            if (!pending.length) continue;

            processed += 1;
            const pendingWorkers = pending.map((item) => ({
                workerId: item.workerId,
                years: item.years,
            }));
            const template = getAnniversaryReminderTemplate({
                recipientName: personName(member) || member.email,
                people: pending.map((item) => ({
                    name: personName(item),
                    years: item.years,
                })),
                actionUrl,
            });

            let stage: "send_mail" | "record_sent" = "send_mail";
            try {
                const result = await sendMail({
                    to: member.email,
                    subject: template.subject,
                    text: template.text,
                    html: template.html,
                    via: "resend",
                    idempotencyKey: `anniversary:${organizationId}:${member.id}:${pending
                        .map((item) => `${item.workerId}-${item.years}`)
                        .sort()
                        .join(",")}`,
                });
                if (result.error) throw new Error(result.error.message);

                stage = "record_sent";
                await prisma.anniversaryReminderSent.createMany({
                    data: pending.map((item) => ({
                        id: randomUUID(),
                        organizationId,
                        workerId: item.workerId,
                        years: item.years,
                        anniversaryDate: item.anniversaryDate,
                        recipientUserId: member.id,
                    })),
                    skipDuplicates: true,
                });
                succeeded += 1;
                cronInfo(JOB, {
                    event: "send_succeeded",
                    outcome: "ok",
                    organizationId,
                    berlinDay,
                    recipientUserId: member.id,
                    recipientEmail: member.email,
                    workers: pendingWorkers,
                    actionUrl,
                });
            } catch (error) {
                failed += 1;
                cronError(JOB, {
                    event:
                        stage === "send_mail"
                            ? "send_failed"
                            : "record_sent_failed",
                    outcome: "failed",
                    stage,
                    organizationId,
                    berlinDay,
                    recipientUserId: member.id,
                    recipientEmail: member.email,
                    workers: pendingWorkers,
                    error: serializeCronError(error),
                });
            }
        }
    }

    const summary = { processed, succeeded, failed };
    cronInfo(JOB, {
        event: "run_complete",
        outcome: failed ? "failed" : "ok",
        berlinDay,
        dueCount: due.length,
        organizationCount: byOrg.size,
        ...summary,
    });
    return summary;
}
