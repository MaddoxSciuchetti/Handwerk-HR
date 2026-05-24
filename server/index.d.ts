import type { User as DbUser } from "@prisma/client";

declare global {
    namespace Express {
        interface Request {
            userId: DbUser["id"];
            tokenId?: string;
            sessionId?: string;
            orgId: string;
        }
    }
}

export {};
