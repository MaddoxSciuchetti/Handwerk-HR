import { OrgStatusEntityType } from "../api/orgStatus.api";

export function usageLine(entityType: OrgStatusEntityType, n: number) {
    if (n <= 0) return null;
    if (entityType === 'engagement') {
      return n === 1 ? '1 Projekt' : `${n} Projekte`;
    }
    return n === 1 ? '1 Issue' : `${n} Issues`;
  }