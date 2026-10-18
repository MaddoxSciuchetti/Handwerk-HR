export function isQuestionnaireOrContractTemplateTask(title: string) {
    const normalized = title.trim().toLocaleLowerCase("de-DE");
    return (
        normalized.includes("fragebogen") ||
        normalized.includes("arbeitsvertrag")
    );
}

export function templateItemsForEngagement<T extends { id: string; title: string }>(
    items: T[],
    options: {
        remainingOnly: boolean;
        existingTemplateItemIds: Iterable<string>;
    },
) {
    const taken = new Set(options.existingTemplateItemIds);
    return items.filter((item) => {
        if (taken.has(item.id)) return false;
        if (
            options.remainingOnly &&
            isQuestionnaireOrContractTemplateTask(item.title)
        ) {
            return false;
        }
        return true;
    });
}
