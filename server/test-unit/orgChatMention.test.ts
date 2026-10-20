import { prisma } from "@/lib/prisma";
import { postOrgChatMessage } from "@/services/orgChat";
import { createIssue } from "@/services/worker.service";
import { sendMail } from "@/utils/sendMail";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        orgChatMessage: { create: jest.fn() },
        user: { findFirst: jest.fn(), findMany: jest.fn() },
    },
}));
jest.mock("@/services/worker.service", () => ({ createIssue: jest.fn() }));
jest.mock("@/utils/sendMail", () => ({ sendMail: jest.fn() }));
jest.mock("@/constants/env", () => ({ APP_ORIGIN: "https://app.example" }));

describe("organization chat mentions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (prisma.orgChatMessage.create as jest.Mock).mockResolvedValue({ id: "message-1" });
        (prisma.user.findFirst as jest.Mock).mockResolvedValue({
            firstName: "Mia", lastName: "Meier", email: "mia@firma.de",
        });
        (prisma.user.findMany as jest.Mock).mockResolvedValue([
            { id: "recipient", firstName: "Otto", lastName: "Berg", email: "otto@firma.de" },
        ]);
        (sendMail as jest.Mock).mockResolvedValue({ error: null });
    });

    it("saves the message and notifies the recipient without creating an urgent task", async () => {
        const result = await postOrgChatMessage("org-1", "sender", {
            body: "@Otto Berg bitte erledigen",
            mentionUserIds: ["recipient", "recipient", "sender"],
        });

        expect(prisma.orgChatMessage.create).toHaveBeenCalledWith(expect.objectContaining({
            data: { organizationId: "org-1", userId: "sender", body: "@Otto Berg bitte erledigen" },
        }));
        expect(createIssue).not.toHaveBeenCalled();
        expect(sendMail).toHaveBeenCalledTimes(1);
        expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "otto@firma.de" }));
        expect(result).toEqual({ message: { id: "message-1" }, mailFailed: false });
    });

    it("reports a failed email without creating a fallback task", async () => {
        (sendMail as jest.Mock).mockResolvedValue({ error: { message: "Delivery failed" } });
        const result = await postOrgChatMessage("org-1", "sender", {
            body: "@Otto Berg hilfe", mentionUserIds: ["recipient"],
        });
        expect(result.mailFailed).toBe(true);
        expect(createIssue).not.toHaveBeenCalled();
    });
});
