import { prisma } from "@/lib/prisma";
import { insertTemplateTask, modifyTemplateTask } from "./template.service";
jest.mock("@/lib/prisma", () => ({
    prisma: {
        issueTemplate: { findFirst: jest.fn() },
        mailTemplate: { findFirst: jest.fn() },
        organizationIntegration: { findUnique: jest.fn() },
        templateItem: { create: jest.fn(), update: jest.fn() },
    },
}));
const data = {
    templateId: "task-template",
    taskName: "Welcome to Teams",
    organizationId: "org",
    integrationProvider: "microsoft_graph" as const,
    sequence: "microsoft_send_teams_message" as const,
    mailTemplateId: "message-template",
};
beforeEach(() => {
    jest.clearAllMocks();
    (prisma.issueTemplate.findFirst as jest.Mock).mockResolvedValue({
        id: "task-template",
    });
    (prisma.organizationIntegration.findUnique as jest.Mock).mockResolvedValue({
        enabled: true,
    });
    (prisma.mailTemplate.findFirst as jest.Mock).mockResolvedValue({
        id: "message-template",
        body: "Hello {{Vorname}}",
    });
});
it("retains the message template when creating or editing a reusable Teams task", async () => {
    await insertTemplateTask(data);
    expect(prisma.templateItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
            data: expect.objectContaining({
                mailTemplateId: "message-template",
                sequence: "microsoft_send_teams_message",
            }),
        }),
    );
    await modifyTemplateTask("item", "org", data);
    expect(prisma.templateItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
            data: expect.objectContaining({
                mailTemplateId: "message-template",
                sequence: "microsoft_send_teams_message",
            }),
        }),
    );
});
it("rejects an empty Teams body and scopes template access to the organization", async () => {
    (prisma.mailTemplate.findFirst as jest.Mock).mockResolvedValue({
        id: "message-template",
        body: "",
    });
    await expect(insertTemplateTask(data)).rejects.toThrow(
        "Nachrichtenvorlage mit Inhalt",
    );
    expect(prisma.mailTemplate.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: "message-template", organizationId: "org" },
        }),
    );
    expect(prisma.templateItem.create).not.toHaveBeenCalled();
});
