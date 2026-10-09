export const O365_BLOCK_SIGN_IN = "o365-block-signin";
export const TEAM_DEPARTURE_MAIL = "team-departure-mail";

export const TASK_AUTOMATIONS = [
    {
        id: O365_BLOCK_SIGN_IN,
        name: "O365 Zugang sperren",
    },
    {
        id: TEAM_DEPARTURE_MAIL,
        name: "Infomail Entlassung",
    },
] as const;

export type TaskAutomationId = (typeof TASK_AUTOMATIONS)[number]["id"];

export function isTaskAutomationId(value: string): value is TaskAutomationId {
    return TASK_AUTOMATIONS.some((item) => item.id === value);
}

export function taskAutomationName(id: string) {
    return TASK_AUTOMATIONS.find((item) => item.id === id)?.name ?? id;
}
