import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { POSTGRES_URI } from "@/constants/env";

if (process.env.NODE_ENV === "production") {
    console.log("Skipping seed (production environment)");
    process.exit(0);
}

const adapter = new PrismaPg({ connectionString: POSTGRES_URI });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting database seed for User model...");

    const adminEmail = "admin@example.com";
    const hashedPassword = await bcrypt.hash("Admin123!", 10);

    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            vorname: "Admin",
            nachname: "User",
            cloud_url: "https://example.com/cloud",
            email: adminEmail,
            password: hashedPassword,
            verified: true,
            user_permission: UserRole.CHEF,
        },
    });

    console.log(`✅ Seed complete. Admin user: ${adminUser.email}`);
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
