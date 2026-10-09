import { isQuestionnaireOrContractTemplateTask } from "@/services/onboardingTemplateTasks";

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
