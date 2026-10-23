import { templateItemsForEngagement } from "@/services/onboardingTemplateTasks";

describe("templateItemsForEngagement", () => {
    const items = [
        { id: "q", title: "Fragebogen" },
        { id: "c", title: "Arbeitsvertrag drucken" },
        { id: "w", title: "Willkommensmail an das Team" },
        { id: "k", title: "Arbeitskleidung" },
    ];
    it.each([false, true])(
        "includes questionnaire and contract items (remainingOnly=%s)",
        (remainingOnly) => {
            expect(
                templateItemsForEngagement(items, {
                    remainingOnly,
                    existingTemplateItemIds: [],
                }),
            ).toEqual(items);
        },
    );
    it("only skips template items already created for this engagement", () => {
        expect(
            templateItemsForEngagement(items, {
                remainingOnly: true,
                existingTemplateItemIds: ["k"],
            }).map((item) => item.id),
        ).toEqual(["q", "c", "w"]);
    });
});
