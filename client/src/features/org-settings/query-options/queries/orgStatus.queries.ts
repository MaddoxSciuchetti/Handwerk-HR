import { queryOptions } from '@tanstack/react-query';
import {
  fetchOrgStatuses,
  type OrgStatusEntityType,
  type OrgStatusRow,
} from '../../api/orgStatus.api';
import { ORG_STATUSES } from '../../consts/query-key.consts';

export const orgStatusQueries = {
  list: (entityType: OrgStatusEntityType) =>
    queryOptions<OrgStatusRow[], Error>({
      queryKey: [ORG_STATUSES, entityType] as const,
      queryFn: () => fetchOrgStatuses(entityType),
    }),
};
