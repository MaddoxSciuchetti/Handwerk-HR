import { apiJson } from '@/config/apiClient';
import {
  ListOrgStatusesResponse,
  OrgStatus,
  StatusEntityType,
} from './org-status.types';

export async function fetchOrgStatuses(
  entityType: StatusEntityType
): Promise<OrgStatus[]> {
  const res = await apiJson.get<ListOrgStatusesResponse>('/org/statuses', {
    params: { entityType },
  });
  return res.statuses;
}

export async function createOrgStatus(
  entityType: StatusEntityType,
  name: string
): Promise<OrgStatus> {
  return apiJson.post<
    OrgStatus,
    { entityType: StatusEntityType; name: string }
  >('/org/statuses', { entityType, name });
}

export async function updateOrgStatus(
  id: string,
  name: string
): Promise<OrgStatus> {
  return apiJson.patch<OrgStatus, { name: string }>(`/org/statuses/${id}`, {
    name,
  });
}

export async function deleteOrgStatus(id: string): Promise<void> {
  return apiJson.delete(`/org/statuses/${id}`);
}
