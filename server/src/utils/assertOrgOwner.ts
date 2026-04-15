import { FORBIDDEN, UNAUTHORIZED } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import appAssert from "@/utils/appAssert";

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
            role: { name: "Owner" },
        },
        select: { id: true },
    });

    appAssert(owner, FORBIDDEN, "Nur Organisationsinhaber können das.");

    return orgId;
}
