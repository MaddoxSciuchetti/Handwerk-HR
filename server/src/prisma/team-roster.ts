import type { PrismaClient } from "@prisma/client";

export type TeamRosterPerson = {
    firstName: string;
    lastName: string;
    birthday: string;
    entryDate: string | null;
};

export const TEAM_ROSTER: TeamRosterPerson[] = [
    { firstName: "Sannaullah", lastName: "Qaderi", birthday: "1997-01-01", entryDate: "2026-07-15" },
    { firstName: "Annika", lastName: "Bimmel", birthday: "2005-01-07", entryDate: "2025-02-01" },
    { firstName: "Timo", lastName: "Janik", birthday: "1981-01-09", entryDate: "2015-07-01" },
    { firstName: "Christoph", lastName: "Stürmer", birthday: "1987-01-30", entryDate: "2026-08-17" },
    { firstName: "Liridön", lastName: "Aliti", birthday: "2002-02-12", entryDate: "2025-11-17" },
    { firstName: "Benny", lastName: "Wendt", birthday: "1986-03-25", entryDate: "2014-04-01" },
    { firstName: "Najeebullah", lastName: "Esazada", birthday: "1985-04-05", entryDate: "2018-08-01" },
    { firstName: "Marvin", lastName: "Langner", birthday: "1998-04-13", entryDate: "2025-03-17" },
    { firstName: "Kerem", lastName: "Sen", birthday: "1997-04-14", entryDate: "2023-03-15" },
    { firstName: "Constantin", lastName: "Romaniuc", birthday: "1993-04-18", entryDate: "2018-01-01" },
    { firstName: "Sandra", lastName: "Siemon", birthday: "1980-05-31", entryDate: "2005-05-12" },
    { firstName: "Nico", lastName: "Lange", birthday: "1994-08-10", entryDate: "2025-04-15" },
    { firstName: "Darius", lastName: "Acosta", birthday: "1996-08-14", entryDate: "2022-12-01" },
    { firstName: "Franz", lastName: "Raudszus", birthday: "1993-09-08", entryDate: "2022-06-13" },
    { firstName: "Bekir", lastName: "Yatci", birthday: "2001-09-15", entryDate: "2026-09-01" },
    { firstName: "Markus", lastName: "Stürzel", birthday: "1973-09-29", entryDate: "2023-05-22" },
    { firstName: "René", lastName: "Michaelis", birthday: "1968-11-20", entryDate: "2026-07-01" },
    { firstName: "Stephan", lastName: "Marszal", birthday: "1968-12-05", entryDate: "2018-10-01" },
    { firstName: "Thomas", lastName: "Hadrich", birthday: "1969-12-15", entryDate: "2015-06-01" },
    { firstName: "Theresa", lastName: "Hoffmann", birthday: "1990-12-21", entryDate: "2026-01-01" },
    { firstName: "Vulnet", lastName: "Shemsi", birthday: "1998-12-13", entryDate: null },
];

export function teamPlaceholderEmail(firstName: string, lastName: string) {
    const slug = (value: string) =>
        value
            .normalize("NFD")
            .replace(/\p{M}/gu, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "");
    return `${slug(firstName)}.${slug(lastName)}@team.invalid`;
}

function calendarDate(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
}

export async function seedTeamRoster(
    prisma: PrismaClient,
    organizationId: string,
    userId: string,
) {
    for (const person of TEAM_ROSTER) {
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
                entryDate: person.entryDate ? calendarDate(person.entryDate) : null,
                status: "active",
            },
        });

        await prisma.workerEngagement.create({
            data: {
                workerId: worker.id,
                organizationId,
                responsibleUserId: userId,
                status: "completed",
                type: "transfer",
                startDate: person.entryDate ? calendarDate(person.entryDate) : null,
                completedAt: new Date(),
            },
        });
    }
}
