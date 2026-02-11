import type { Session, User } from "shared_prisma_types/prisma";
declare global {
    namespace Express {
        interface Request {
            userId: User["id"];
            sessionId: Session["id"];
        }
    }
}

export {};
