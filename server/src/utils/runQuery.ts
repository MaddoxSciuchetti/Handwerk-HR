import { prisma } from "@/lib/prisma";
import { Intent } from "@/types/runQuery.types";

async function runQuery(intent: Intent) {
    if (intent.action === "count") return prisma.user.count();
}

export default runQuery;
