import { prisma } from "@/lib/prisma";
import { AbsenceType } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

export type UpdateAbsenceParams = {
    userId: string;
    orgId: string;
    absenceType: AbsenceType;
    startDate: Date;
    endDate: Date;
    substituteId?: string;
};

// ============================================================
// HELPER — compute isAbsent from absence records
// ============================================================

export const computeIsAbsent = (
    absences: { startDate: Date; endDate: Date }[],
) => {
    const now = new Date();
    return absences.some((a) => a.startDate <= now && a.endDate >= now);
};

// ============================================================
// QUERY ALL EMPLOYEES IN ORG
// ============================================================

export const queryEmployeeWorkerData = async (orgId: string) => {
    return await prisma.workerEngagement.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            type: true,
            startDate: true,
            endDate: true,
            completedAt: true,
            createdAt: true,
            updatedAt: true,
            engagementStatus: {
                select: { id: true, name: true, color: true },
            },
            worker: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    position: true,
                    status: true,
                },
            },
            responsibleUser: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                    absences: {
                        where: { endDate: { gte: new Date() } },
                        orderBy: { endDate: "desc" },
                        take: 1,
                        select: {
                            absenceType: true,
                            startDate: true,
                            endDate: true,
                            substitute: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
            },
            issues: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    priority: true,
                    dueDate: true,
                    createdAt: true,
                    updatedAt: true,
                    issueStatus: {
                        select: { id: true, name: true, color: true },
                    },
                    assignee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                        },
                    },
                    auditLogs: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: {
                            createdAt: true,
                            actorUser: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
};

export const queryEmployee = async (orgId: string) => {
    return await prisma.user.findMany({
        where: {
            organizationMembers: {
                some: { organizationId: orgId },
            },
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            isVerified: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            organizationMembers: {
                where: { organizationId: orgId },
                select: {
                    membershipRole: true,
                },
            },
            absences: {
                orderBy: { startDate: "desc" },
                take: 1,
                select: {
                    id: true,
                    absenceType: true,
                    startDate: true,
                    endDate: true,
                    substitute: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
        },
    });
};

// ============================================================
// QUERY SINGLE EMPLOYEE BY ID
// ============================================================

export const queryEmployeeById = async (id: string, orgId: string) => {
    return await prisma.user.findFirst({
        where: {
            id,
            organizationMembers: {
                some: { organizationId: orgId },
            },
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            isVerified: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            organizationMembers: {
                where: { organizationId: orgId },
                select: {
                    membershipRole: true,
                },
            },
            absences: {
                orderBy: { startDate: "desc" },
                select: {
                    id: true,
                    absenceType: true,
                    startDate: true,
                    endDate: true,
                    substitute: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
        },
    });
};

// ============================================================
// REMOVE EMPLOYEE FROM ORG
// ============================================================

export const removeEmployee = async (id: string, orgId: string) => {
    // remove the org membership — does not delete the user entirely
    return await prisma.organizationMember.delete({
        where: {
            userId_organizationId: {
                userId: id,
                organizationId: orgId,
            },
        },
    });
};

// ============================================================
// UPSERT ABSENCE
// ============================================================

export const updateAbsenceData = async (data: UpdateAbsenceParams) => {
    const overlapping = await prisma.absence.findFirst({
        where: {
            userId: data.userId,
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate },
        },
    });

    if (overlapping) {
        return await prisma.absence.update({
            where: { id: overlapping.id },
            data: {
                absenceType: data.absenceType,
                startDate: data.startDate,
                endDate: data.endDate,
                substituteId: data.substituteId,
            },
        });
    }

    return await prisma.absence.create({
        data: {
            userId: data.userId,
            orgId: data.orgId,
            absenceType: data.absenceType,
            startDate: data.startDate,
            endDate: data.endDate,
            substituteId: data.substituteId,
        },
    });
};
