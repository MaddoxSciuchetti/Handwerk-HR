import { POSTGRES_URI } from "@/constants/env";
import { appendSubscriptionAuditLog } from "@/services/subscriptionAudit.service";
import { PrismaPg } from "@prisma/adapter-pg";
import { OrgMemberRole, PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

/**
 * Idempotent seed aligned with current schema + signup defaults (`auth.serviceV2`).
 *
 * Env (optional):
 * - SKIP_DB_SEED=true — exit without changes (e.g. production if you don’t want seed)
 * - SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD — defaults: admin@example.com / Admin123!
 * - SEED_ORG_SLUG — default: demo-org (must stay stable for upserts)
 * - SEED_RESET_ADMIN_PASSWORD=true — re-hash admin password from SEED_ADMIN_PASSWORD (optional)
 */
if (process.env.SKIP_DB_SEED === "true") {
    console.log("Skipping seed (SKIP_DB_SEED=true)");
    process.exit(0);
}

const adapter = new PrismaPg({ connectionString: POSTGRES_URI });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
const ORG_SLUG = process.env.SEED_ORG_SLUG ?? "demo-org";

async function ensureDefaultStatuses(organizationId: string) {
    const engagementCount = await prisma.engagementStatus.count({
        where: { organizationId },
    });
    const issueCount = await prisma.issueStatus.count({
        where: { organizationId },
    });

    if (engagementCount === 0) {
        await prisma.engagementStatus.createMany({
            data: [
                {
                    organizationId,
                    name: "Ausstehend",
                    isDefault: true,
                    orderIndex: 0,
                },
                {
                    organizationId,
                    name: "In Bearbeitung",
                    isDefault: false,
                    orderIndex: 1,
                },
                {
                    organizationId,
                    name: "Abgeschlossen",
                    isDefault: false,
                    orderIndex: 2,
                },
                {
                    organizationId,
                    name: "Abgebrochen",
                    isDefault: false,
                    orderIndex: 3,
                },
            ],
        });
    }

    if (issueCount === 0) {
        await prisma.issueStatus.createMany({
            data: [
                {
                    organizationId,
                    name: "Offen",
                    isDefault: true,
                    orderIndex: 0,
                },
                {
                    organizationId,
                    name: "In Arbeit",
                    isDefault: false,
                    orderIndex: 1,
                },
                {
                    organizationId,
                    name: "Erledigt",
                    isDefault: false,
                    orderIndex: 2,
                },
                {
                    organizationId,
                    name: "Abgebrochen",
                    isDefault: false,
                    orderIndex: 3,
                },
            ],
        });
    }
}

async function main() {
    console.log("Starting database seed…");

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const user = await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: {
            firstName: "Admin",
            lastName: "User",
            isVerified: true,
            status: "active",
        },
        create: {
            email: ADMIN_EMAIL,
            passwordHash,
            firstName: "Admin",
            lastName: "User",
            isVerified: true,
            status: "active",
        },
    });

    if (process.env.SEED_RESET_ADMIN_PASSWORD === "true") {
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });
        console.log(
            "Admin password hash updated (SEED_RESET_ADMIN_PASSWORD=true)",
        );
    }

    const organization = await prisma.organization.upsert({
        where: { slug: ORG_SLUG },
        update: {
            createdByUserId: user.id,
            name: "Demo Organization",
        },
        create: {
            name: "Demo Organization",
            slug: ORG_SLUG,
            createdByUserId: user.id,
            description: "Seeded org for local/staging",
            status: "active",
        },
    });

    const membership = await prisma.organizationMember.findFirst({
        where: {
            userId: user.id,
            organizationId: organization.id,
        },
    });
    if (!membership) {
        await prisma.organizationMember.create({
            data: {
                userId: user.id,
                organizationId: organization.id,
                membershipRole: OrgMemberRole.admin,
                status: "active",
            },
        });
    } else if (membership.membershipRole !== OrgMemberRole.admin) {
        await prisma.organizationMember.update({
            where: { id: membership.id },
            data: { membershipRole: OrgMemberRole.admin, status: "active" },
        });
    }

    await ensureDefaultStatuses(organization.id);

    const subscription = await prisma.subscription.upsert({
        where: { organizationId: organization.id },
        update: {},
        create: {
            organizationId: organization.id,
            plan: "free",
            status: "trialing",
        },
    });

    await appendSubscriptionAuditLog({
        subscriptionId: subscription.id,
        source: "system",
        action: "subscription.seeded",
        newValue: { plan: subscription.plan, status: subscription.status },
    });

    console.log(
        `Seed complete. User: ${user.email} | Org: ${organization.slug} (${organization.id})`,
    );
}

main()
    .catch((e) => {
        console.error("Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
