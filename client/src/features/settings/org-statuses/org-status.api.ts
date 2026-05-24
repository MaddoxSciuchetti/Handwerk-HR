import API from '@/config/apiClient';
import { ListOrgStatusesResponse, OrgStatus } from './org-status.types';

export async function fetchOrgStatuses(): Promise<OrgStatus[]> {
  const res = await API.get<ListOrgStatusesResponse, ListOrgStatusesResponse>(
    '/org/statuses'
  );
  return res.statuses;
}

export async function createOrgStatus(name: string): Promise<OrgStatus> {
  return API.post<OrgStatus, OrgStatus>('/org/statuses', { name });
}

export async function updateOrgStatus(
  id: string,
  name: string
): Promise<OrgStatus> {
  return API.patch<OrgStatus, OrgStatus, { name: string }>(
    `/org/statuses/${id}`,
    {
      name,
    }
  );
}

export async function deleteOrgStatus(id: string): Promise<void> {
  return API.delete(`/org/statuses/${id}`);
}
