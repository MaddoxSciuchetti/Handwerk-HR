export function isQuestionnaireOrContractTemplateTask(title: string) {
    const normalized = title.trim().toLocaleLowerCase("de-DE");
    return (
        normalized.includes("fragebogen") ||
        normalized.includes("arbeitsvertrag")
    );
}
