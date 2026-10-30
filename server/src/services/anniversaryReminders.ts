import { randomUUID } from "node:crypto";
import { berlinToday, calendarDayUtc } from "../../../shared/calendarDate";
import {
    dueCompanyAnniversary,
    type CompanyAnniversary,
} from "../../../shared/companyAnniversary";
import { isTeamMember } from "../../../shared/teamMembers";
import { APP_ORIGIN, FRONTENDURL } from "@/constants/env";
import { prisma } from "@/lib/prisma";
import { getAnniversaryReminderTemplate } from "@/utils/emailTemplates";
import { sendMail } from "@/utils/sendMail";

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

function teamActionUrl() {
    const origin =
        FRONTENDURL.replace(/\/$/, "") ||
        APP_ORIGIN.split(",")[0]?.trim().replace(/\/$/, "") ||
        "";
    return `${origin}/team`;
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
    const due = findDueAnniversariesForWorkers(
        await loadCandidateWorkers(),
        now,
    );
    if (!due.length) {
        return { processed: 0, succeeded: 0, failed: 0 };
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
    const actionUrl = teamActionUrl();

    for (const [organizationId, anniversaries] of byOrg) {
        const members = await loadActiveMembers(organizationId);
        if (!members.length) continue;

        const alreadySent = await prisma.anniversaryReminderSent.findMany({
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
            const template = getAnniversaryReminderTemplate({
                recipientName: personName(member) || member.email,
                people: pending.map((item) => ({
                    name: personName(item),
                    years: item.years,
                })),
                actionUrl,
            });

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
                console.info("anniversary-reminder", {
                    organizationId,
                    recipientUserId: member.id,
                    workers: pending.map((item) => item.workerId),
                });
            } catch (error) {
                failed += 1;
                console.error("anniversary-reminder", {
                    organizationId,
                    recipientUserId: member.id,
                    error,
                });
            }
        }
    }

    return { processed, succeeded, failed };
}
