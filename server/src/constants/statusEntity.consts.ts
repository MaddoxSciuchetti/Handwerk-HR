/** Org status APIs manage engagement (project) statuses only. */
export type OrgStatusEntityType = "engagement";

export const ORG_STATUS_ENTITY_ENGAGEMENT =
    "engagement" as const satisfies OrgStatusEntityType;
