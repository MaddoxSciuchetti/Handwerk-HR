import {
    STATUS_ENTITY_ENGAGEMENT,
    type StatusEntityType,
} from "@/constants/statusEntity.consts";
import { BAD_REQUEST, CONFLICT, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import appAssert from "@/utils/appAssert";

export async function listOrganizationStatuses(
    organizationId: string,
    entityType: StatusEntityType,
) {
    const rows = await prisma.organizationStatus.findMany({
        where: { organizationId, entityType },
        orderBy: { orderIndex: "asc" },
        include: {
            _count: { select: { engagements: true, issues: true } },
        },
    });
    return rows.map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        orderIndex: r.orderIndex,
        isDefault: r.isDefault,
        usageCount:
            entityType === STATUS_ENTITY_ENGAGEMENT
                ? r._count.engagements
                : r._count.issues,
    }));
}

export async function createOrganizationStatus(
    organizationId: string,
    entityType: StatusEntityType,
    input: { name: string; color?: string | null },
) {
    const name = input.name.trim();
    appAssert(name.length > 0, BAD_REQUEST, "Name erforderlich");

    const total = await prisma.organizationStatus.count({
        where: { organizationId, entityType },
    });

    try {
        return await prisma.organizationStatus.create({
            data: {
                organizationId,
                entityType,
                name,
                color: input.color?.trim() || null,
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

export async function updateOrganizationStatus(
    organizationId: string,
    statusId: string,
    input: { name?: string; color?: string | null },
) {
    const existing = await prisma.organizationStatus.findFirst({
        where: { id: statusId, organizationId },
    });
    appAssert(existing, NOT_FOUND, "Status nicht gefunden");

    const data: { name?: string; color?: string | null } = {};
    if (input.name !== undefined) {
        const name = input.name.trim();
        appAssert(name.length > 0, BAD_REQUEST, "Name erforderlich");
        data.name = name;
    }
    if (input.color !== undefined) data.color = input.color?.trim() || null;

    if (Object.keys(data).length === 0) return existing;

    try {
        return await prisma.organizationStatus.update({
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
    const existing = await prisma.organizationStatus.findFirst({
        where: { id: statusId, organizationId },
        include: {
            _count: { select: { engagements: true, issues: true } },
        },
    });
    appAssert(existing, NOT_FOUND, "Status nicht gefunden");

    const total = await prisma.organizationStatus.count({
        where: { organizationId, entityType: existing.entityType },
    });
    appAssert(
        total > 1,
        BAD_REQUEST,
        "Der letzte Status kann nicht gelöscht werden",
    );

    const usage =
        existing.entityType === STATUS_ENTITY_ENGAGEMENT
            ? existing._count.engagements
            : existing._count.issues;
    appAssert(
        usage === 0,
        BAD_REQUEST,
        "Status ist noch in Verwendung und kann nicht gelöscht werden",
    );

    await prisma.organizationStatus.delete({ where: { id: statusId } });
}
