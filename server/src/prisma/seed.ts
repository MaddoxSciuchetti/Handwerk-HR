import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seed for User model...");

    const adminEmail = "admin@example.com";
    const hashedPassword = await bcrypt.hash("Admin123!", 10);

    // Upsert ensures that if the user already exists, it won't be duplicated
    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {}, // you can add 'update' data here if desired
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
