export type Intent = {
    action: "count" | "list" | "get";
    entity: "workers" | "forms" | "form_inputs";
    filter: {
        form_type: "ONBOARDING" | "OFFBOARDING" | null;
        completed: boolean | null;
        user_id: number | null;
    };
};

export type AgentResponse = {
    reply: string;
};
