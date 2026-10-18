import {
    isQuestionnaireOrContractTemplateTask,
    templateItemsForEngagement,
} from "@/services/onboardingTemplateTasks";

describe("isQuestionnaireOrContractTemplateTask", () => {
    it("skips the questionnaire and contract steps that already exist", () => {
        expect(isQuestionnaireOrContractTemplateTask("Fragebogen")).toBe(true);
        expect(
            isQuestionnaireOrContractTemplateTask(
                "Personalfragebogen inkl. notwendiger Dokumente",
            ),
        ).toBe(true);
        expect(isQuestionnaireOrContractTemplateTask("Arbeitsvertrag")).toBe(
            true,
        );
        expect(
            isQuestionnaireOrContractTemplateTask(
                "Arbeitsvertrag unterschrieben zurück",
            ),
        ).toBe(true);
    });

    it("keeps the other onboarding steps", () => {
        expect(
            isQuestionnaireOrContractTemplateTask("Willkommensmail an das Team"),
        ).toBe(false);
        expect(
            isQuestionnaireOrContractTemplateTask("Arbeitskleidung"),
        ).toBe(false);
    });
});

describe("templateItemsForEngagement", () => {
    const items = [
        { id: "q", title: "Fragebogen" },
        { id: "c", title: "Arbeitsvertrag drucken" },
        { id: "w", title: "Willkommensmail an das Team" },
        { id: "k", title: "Arbeitskleidung" },
    ];

    it("keeps every new item when the template is chosen up front", () => {
        expect(
            templateItemsForEngagement(items, {
                remainingOnly: false,
                existingTemplateItemIds: [],
            }).map((item) => item.id),
        ).toEqual(["q", "c", "w", "k"]);
    });

    it("fills only the steps the fast track has not created yet", () => {
        expect(
            templateItemsForEngagement(items, {
                remainingOnly: true,
                existingTemplateItemIds: ["k"],
            }).map((item) => item.id),
        ).toEqual(["w"]);
    });
});
