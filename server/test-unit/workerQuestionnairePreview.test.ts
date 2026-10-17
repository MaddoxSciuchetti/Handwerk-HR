import { getWorkerById } from "@/services/worker.service";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
    prisma: { worker: { findFirst: jest.fn() } },
}));
jest.mock("@/services/arbeitszeugnis", () => ({ certificateText: jest.fn() }));

it("returns completed questionnaire details in the worker preview without exposing raw answers", async () => {
    (prisma.worker.findFirst as jest.Mock).mockResolvedValue({
        id: "worker",
        firstName: "Lukas",
        birthday: null,
        street: null,
        city: null,
        postalCode: null,
        position: null,
        entryDate: null,
        documents: [],
        engagements: [
            {
                arbeitszeugnis: null,
                questionnaireSubmission: {
                    id: "submission",
                    status: "completed",
                    completedAt: new Date("2026-10-17"),
                    formDefinition: { name: "Personalfragebogen" },
                    answers: [
                        { key: "birthday", value: "1992-03-04" },
                        { key: "street", value: "Musterstraße 12" },
                        { key: "postalCode", value: "10115" },
                        { key: "city", value: "Berlin" },
                        { key: "jobTitle", value: "Monteur" },
                        { key: "entryDate", value: "2026-11-01" },
                    ],
                },
            },
        ],
    });
    const worker = await getWorkerById("worker", "org", "viewer");
    expect(worker).toMatchObject({
        birthday: new Date("1992-03-04T00:00:00Z"),
        street: "Musterstraße 12",
        postalCode: "10115",
        city: "Berlin",
        position: "Monteur",
        entryDate: new Date("2026-11-01T00:00:00Z"),
    });
    expect(worker?.engagements[0].questionnaireSubmission).not.toHaveProperty(
        "answers",
    );
    expect(prisma.worker.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: "worker", organizationId: "org" },
        }),
    );
});
