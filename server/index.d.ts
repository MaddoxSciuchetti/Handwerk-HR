import { Session, User } from "./generated/prisma/client";

type DebugUser = User;
type DebugSession = Session;

declare global {
    namespace Express {
        interface Request {
            userId: DebugUser["id"];
            tokenId?: string;
            sessionId?: string;
            /** Set when the user has an active organization membership. */
            orgId?: string;
        }
    }
}

export {};
