import type { EngagementType, PrismaClient } from "@prisma/client";

export type DemoWorkerPerson = {
    firstName: string;
    lastName: string;
    birthday: string;
    entryDate: string | null;
    exitDate?: string | null;
    position?: string | null;
    engagementType: EngagementType;
};

/** Realistic German demo Handwerker for local/staging seed. */
export const DEMO_WORKERS: DemoWorkerPerson[] = [
    // Team (no Aufgaben tab)
    {
        firstName: "Anna",
        lastName: "Schneider",
        birthday: "1991-03-12",
        entryDate: "2019-04-01",
        position: "Projektleitung",
        engagementType: "transfer",
    },
    {
        firstName: "Lukas",
        lastName: "Becker",
        birthday: "1988-07-22",
        entryDate: "2016-09-01",
        position: "Elektriker",
        engagementType: "transfer",
    },
    {
        firstName: "Julia",
        lastName: "Hoffmann",
        birthday: "1995-11-04",
        entryDate: "2021-02-15",
        position: "Bürokauffrau",
        engagementType: "transfer",
    },
    {
        firstName: "Markus",
        lastName: "Weber",
        birthday: "1982-01-30",
        entryDate: "2012-06-01",
        position: "Meister Sanitär",
        engagementType: "transfer",
    },
    {
        firstName: "Sophie",
        lastName: "Fischer",
        birthday: "1997-05-18",
        entryDate: "2023-08-01",
        position: "Malerin",
        engagementType: "transfer",
    },
    {
        firstName: "Tim",
        lastName: "Neumann",
        birthday: "1993-09-09",
        entryDate: "2018-03-12",
        position: "Tischler",
        engagementType: "transfer",
    },
    {
        firstName: "Laura",
        lastName: "Schäfer",
        birthday: "1990-12-02",
        entryDate: "2017-10-01",
        position: "Disponentin",
        engagementType: "transfer",
    },
    {
        firstName: "Jonas",
        lastName: "Wagner",
        birthday: "1986-04-25",
        entryDate: "2014-01-15",
        position: "Dachdecker",
        engagementType: "transfer",
    },
    {
        firstName: "Nina",
        lastName: "Koch",
        birthday: "1999-08-14",
        entryDate: "2024-05-02",
        position: "Azubi Elektro",
        engagementType: "transfer",
    },
    {
        firstName: "Felix",
        lastName: "Bauer",
        birthday: "1984-02-08",
        entryDate: "2011-11-01",
        position: "Monteur",
        engagementType: "transfer",
    },
    {
        firstName: "Claudia",
        lastName: "Richter",
        birthday: "1979-06-27",
        entryDate: "2009-03-01",
        position: "Personal",
        engagementType: "transfer",
    },
    {
        firstName: "Tobias",
        lastName: "Klein",
        birthday: "1992-10-19",
        entryDate: "2020-07-01",
        position: "SHK-Installateur",
        engagementType: "transfer",
    },
    // Onboarding (Aufgaben tab visible)
    {
        firstName: "Emma",
        lastName: "Braun",
        birthday: "2001-01-16",
        entryDate: "2026-11-01",
        position: "Elektrikerin",
        engagementType: "onboarding",
    },
    {
        firstName: "Paul",
        lastName: "Zimmermann",
        birthday: "2003-04-03",
        entryDate: "2026-12-01",
        position: "Azubi Tischler",
        engagementType: "onboarding",
    },
    {
        firstName: "Leon",
        lastName: "Hartmann",
        birthday: "1996-09-21",
        entryDate: "2026-10-15",
        position: "Monteur",
        engagementType: "onboarding",
    },
    // Offboarding (Aufgaben tab visible)
    {
        firstName: "Sarah",
        lastName: "König",
        birthday: "1989-05-11",
        entryDate: "2018-01-08",
        exitDate: "2026-12-31",
        position: "Malermeisterin",
        engagementType: "offboarding",
    },
    {
        firstName: "David",
        lastName: "Lehmann",
        birthday: "1985-12-29",
        entryDate: "2013-04-01",
        exitDate: "2026-11-30",
        position: "Fahrer",
        engagementType: "offboarding",
    },
];

/** @deprecated Use DEMO_WORKERS */
export const TEAM_ROSTER: DemoWorkerPerson[] = DEMO_WORKERS.filter(
    (person) => person.engagementType === "transfer",
);

export type TeamRosterPerson = DemoWorkerPerson;

export function teamPlaceholderEmail(firstName: string, lastName: string) {
    const slug = (value: string) =>
        value
            .normalize("NFD")
            .replace(/\p{M}/gu, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "");
    return `${slug(firstName)}.${slug(lastName)}@demo.invalid`;
}

function calendarDate(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
}

export async function seedTeamRoster(
    prisma: PrismaClient,
    organizationId: string,
    userId: string,
) {
    for (const person of DEMO_WORKERS) {
        const existing = await prisma.worker.findFirst({
            where: {
                organizationId,
                firstName: person.firstName,
                lastName: person.lastName,
            },
            select: { id: true },
        });
        if (existing) continue;

        const worker = await prisma.worker.create({
            data: {
                organizationId,
                createdByUserId: userId,
                firstName: person.firstName,
                lastName: person.lastName,
                email: teamPlaceholderEmail(person.firstName, person.lastName),
                birthday: calendarDate(person.birthday),
                position: person.position ?? null,
                entryDate: person.entryDate
                    ? calendarDate(person.entryDate)
                    : null,
                exitDate: person.exitDate
                    ? calendarDate(person.exitDate)
                    : null,
                status: "active",
            },
        });

        const isTeam = person.engagementType === "transfer";
        await prisma.workerEngagement.create({
            data: {
                workerId: worker.id,
                organizationId,
                responsibleUserId: userId,
                status: isTeam ? "completed" : "pending",
                type: person.engagementType,
                startDate: person.entryDate
                    ? calendarDate(person.entryDate)
                    : null,
                endDate: person.exitDate
                    ? calendarDate(person.exitDate)
                    : null,
                completedAt: isTeam ? new Date() : null,
            },
        });
    }
}
