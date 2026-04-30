/** Query/body discriminator for org status APIs (`engagement` vs `issue`). */
export type OrgStatusEntityType = "engagement" | "issue";

export const ORG_STATUS_ENTITY_ENGAGEMENT =
    "engagement" as const satisfies OrgStatusEntityType;
export const ORG_STATUS_ENTITY_ISSUE =
    "issue" as const satisfies OrgStatusEntityType;
