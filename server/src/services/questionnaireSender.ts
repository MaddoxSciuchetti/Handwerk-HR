import { BAD_REQUEST } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import AppError from "@/utils/AppError";

export async function questionnaireSender(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
    });
    const email = user?.email.trim().toLowerCase();
    if (!email) {
        throw new AppError(BAD_REQUEST, "Die E-Mail-Adresse des angemeldeten Nutzers fehlt.");
    }
    return email;
}
