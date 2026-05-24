/**
 * Idempotent seed for local/staging only.
 *
 * Skipped when:
 * - SKIP_DB_SEED=true
 * - NODE_ENV=production (unless SEED_ENABLED=true)
 *
 * Env (when seed runs):
 * - DATABASE_URL (required)
 * - SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD — defaults: admin@example.com / Admin123!
 * - SEED_ORG_SLUG — default: demo-org
 * - SEED_RESET_ADMIN_PASSWORD=true — re-hash admin password (optional)
 */
function shouldSkipSeed(): boolean {
    if (process.env.SKIP_DB_SEED === "true") {
        return true;
    }
    if (
        process.env.NODE_ENV === "production" &&
        process.env.SEED_ENABLED !== "true"
    ) {
        return true;
    }
    return false;
}

if (shouldSkipSeed()) {
    console.log(
        "Skipping database seed (SKIP_DB_SEED or production without SEED_ENABLED).",
    );
    process.exit(0);
}

async function main() {
    const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
    if (databaseUrl == null || databaseUrl === "") {
        throw new Error("DATABASE_URL is required to run seed");
    }

    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { OrgMemberRole, PrismaClient } = await import("@prisma/client");
    const bcrypt = await import("bcrypt");

    const adapter = new PrismaPg({ connectionString: databaseUrl });
    const prisma = new PrismaClient({ adapter });

    const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
    const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
    const ORG_SLUG = process.env.SEED_ORG_SLUG ?? "demo-org";

    try {
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

        const subscription = await prisma.subscription.upsert({
            where: { organizationId: organization.id },
            update: {},
            create: {
                organizationId: organization.id,
                status: "trialing",
            },
        });

        await prisma.subscriptionAuditLog.create({
            data: {
                subscriptionId: subscription.id,
                source: "system",
                action: "subscription.seeded",
                newValue: {
                    plan: subscription.plan,
                    status: subscription.status,
                },
            },
        });

        console.log(
            `Seed complete. User: ${user.email} | Org: ${organization.slug} (${organization.id})`,
        );
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
});
