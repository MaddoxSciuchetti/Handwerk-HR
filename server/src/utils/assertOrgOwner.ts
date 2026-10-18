import { FORBIDDEN, UNAUTHORIZED } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import appAssert from "@/utils/appAssert";
import type { OrgMemberRole } from "@prisma/client";

export function assertOrgAdmin(role: OrgMemberRole | undefined) {
    appAssert(role === "admin", FORBIDDEN, "Nur Organisationsinhaber können das.");
}

export async function assertOrgOwner(
    userId: string,
    orgId: string | undefined,
): Promise<string> {
    appAssert(
        orgId,
        UNAUTHORIZED,
        "No organization associated with this account",
    );

    const owner = await prisma.organizationMember.findFirst({
        where: {
            userId,
            organizationId: orgId,
            status: "active",
            membershipRole: "admin",
        },
        select: { id: true },
    });

    appAssert(owner, FORBIDDEN, "Nur Organisationsinhaber können das.");

    return orgId;
}
