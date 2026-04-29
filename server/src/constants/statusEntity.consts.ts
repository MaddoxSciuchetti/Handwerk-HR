import { StatusEntityKind } from "@prisma/client";

/** Matches `organization_statuses.entity_type` / Prisma `StatusEntityKind`. */
export const STATUS_ENTITY_ENGAGEMENT = StatusEntityKind.engagement;
export const STATUS_ENTITY_ISSUE = StatusEntityKind.issue;

export type StatusEntityType = StatusEntityKind;
