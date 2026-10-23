export function templateItemsForEngagement<
    T extends { id: string; title: string },
>(
    items: T[],
    options: {
        remainingOnly: boolean;
        existingTemplateItemIds: Iterable<string>;
    },
) {
    const taken = new Set(options.existingTemplateItemIds);
    return items.filter((item) => !taken.has(item.id));
}
