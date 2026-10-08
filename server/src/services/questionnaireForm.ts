export const QUESTIONNAIRE_FIELDS = [
    { key: "street", label: "Straße", type: "text" },
    { key: "postalCode", label: "PLZ", type: "text" },
    { key: "city", label: "Ort", type: "text" },
    { key: "birthday", label: "Geburtsdatum", type: "date" },
    { key: "trouserSize", label: "Hosengröße", type: "text" },
    { key: "tshirtSize", label: "T-Shirt-Größe", type: "text" },
] as const;

export type QuestionnaireFieldKey = (typeof QUESTIONNAIRE_FIELDS)[number]["key"];

export type QuestionnaireAnswers = Record<QuestionnaireFieldKey, string>;
