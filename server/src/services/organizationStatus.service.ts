import {
    ORG_STATUS_ENTITY_ENGAGEMENT,
    type OrgStatusEntityType,
} from "@/constants/statusEntity.consts";
import { BAD_REQUEST, CONFLICT, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import appAssert from "@/utils/appAssert";

export async function listOrganizationStatuses(
    organizationId: string,
    entityType: OrgStatusEntityType,
) {
    if (entityType === ORG_STATUS_ENTITY_ENGAGEMENT) {
        const rows = await prisma.engagementStatus.findMany({
            where: { organizationId },
            orderBy: { orderIndex: "asc" },
            include: {
                _count: { select: { engagements: true } },
            },
        });
        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            color: null as string | null,
            orderIndex: r.orderIndex,
            isDefault: r.isDefault,
            usageCount: r._count.engagements,
        }));
    }

    const rows = await prisma.issueStatus.findMany({
        where: { organizationId },
        orderBy: { orderIndex: "asc" },
        include: {
            _count: { select: { issues: true } },
        },
    });
    return rows.map((r) => ({
        id: r.id,
        name: r.name,
        color: null as string | null,
        orderIndex: r.orderIndex,
        isDefault: r.isDefault,
        usageCount: r._count.issues,
    }));
}

export async function createOrganizationStatus(
    organizationId: string,
    entityType: OrgStatusEntityType,
    input: { name: string },
) {
    const name = input.name.trim();
    appAssert(name.length > 0, BAD_REQUEST, "Name erforderlich");

    if (entityType === ORG_STATUS_ENTITY_ENGAGEMENT) {
        const total = await prisma.engagementStatus.count({
            where: { organizationId },
        });
        try {
            return await prisma.engagementStatus.create({
                data: {
                    organizationId,
                    name,
                    orderIndex: total,
                    isDefault: false,
                },
            });
        } catch (e: unknown) {
            const code =
                typeof e === "object" && e !== null && "code" in e
                    ? (e as { code: string }).code
                    : "";
            appAssert(
                code !== "P2002",
                CONFLICT,
                "Ein Status mit diesem Namen existiert bereits",
            );
            throw e;
        }
    }

    const total = await prisma.issueStatus.count({
        where: { organizationId },
    });
    try {
        return await prisma.issueStatus.create({
            data: {
                organizationId,
                name,
                orderIndex: total,
                isDefault: false,
            },
        });
    } catch (e: unknown) {
        const code =
            typeof e === "object" && e !== null && "code" in e
                ? (e as { code: string }).code
                : "";
        appAssert(
            code !== "P2002",
            CONFLICT,
            "Ein Status mit diesem Namen existiert bereits",
        );
        throw e;
    }
}

async function findStatusAnyTable(organizationId: string, statusId: string) {
    const engagement = await prisma.engagementStatus.findFirst({
        where: { id: statusId, organizationId },
    });
    if (engagement) {
        return {
            kind: "engagement" as const,
            row: engagement,
        };
    }
    const issue = await prisma.issueStatus.findFirst({
        where: { id: statusId, organizationId },
    });
    if (issue) {
        return { kind: "issue" as const, row: issue };
    }
    return null;
}

export async function updateOrganizationStatus(
    organizationId: string,
    statusId: string,
    input: { name?: string },
) {
    const found = await findStatusAnyTable(organizationId, statusId);
    appAssert(found, NOT_FOUND, "Status nicht gefunden");

    const data: { name?: string } = {};
    if (input.name !== undefined) {
        const name = input.name.trim();
        appAssert(name.length > 0, BAD_REQUEST, "Name erforderlich");
        data.name = name;
    }

    if (Object.keys(data).length === 0) return found.row;

    try {
        if (found.kind === "engagement") {
            return await prisma.engagementStatus.update({
                where: { id: statusId },
                data,
            });
        }
        return await prisma.issueStatus.update({
            where: { id: statusId },
            data,
        });
    } catch (e: unknown) {
        const code =
            typeof e === "object" && e !== null && "code" in e
                ? (e as { code: string }).code
                : "";
        appAssert(
            code !== "P2002",
            CONFLICT,
            "Ein Status mit diesem Namen existiert bereits",
        );
        throw e;
    }
}

export async function deleteOrganizationStatus(
    organizationId: string,
    statusId: string,
) {
    const found = await findStatusAnyTable(organizationId, statusId);
    appAssert(found, NOT_FOUND, "Status nicht gefunden");

    const usage =
        found.kind === "engagement"
            ? await prisma.workerEngagement.count({
                  where: { statusId },
              })
            : await prisma.issue.count({
                  where: { statusId },
              });

    const total =
        found.kind === "engagement"
            ? await prisma.engagementStatus.count({ where: { organizationId } })
            : await prisma.issueStatus.count({ where: { organizationId } });
    appAssert(
        total > 1,
        BAD_REQUEST,
        "Der letzte Status kann nicht gelöscht werden",
    );
    appAssert(
        usage === 0,
        BAD_REQUEST,
        "Status ist noch in Verwendung und kann nicht gelöscht werden",
    );

    if (found.kind === "engagement") {
        await prisma.engagementStatus.delete({ where: { id: statusId } });
    } else {
        await prisma.issueStatus.delete({ where: { id: statusId } });
    }
}
