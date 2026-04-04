import API from '@/config/apiClient';

export type OrgStatusEntityType = 'engagement' | 'issue';

export type OrgStatusRow = {
  id: string;
  name: string;
  color: string | null;
  orderIndex: number;
  isDefault: boolean;
  usageCount: number;
};

export async function fetchOrgStatuses(
  entityType: OrgStatusEntityType
): Promise<OrgStatusRow[]> {
  const response = (await API.get('/org/statuses', {
    params: { entityType },
  })) as { statuses: OrgStatusRow[] };
  return response.statuses;
}

export function createOrgStatus(payload: {
  entityType: OrgStatusEntityType;
  name: string;
  color?: string | null;
}) {
  return API.post('/org/statuses', payload);
}

export function updateOrgStatus(
  id: string,
  payload: { name?: string; color?: string | null }
) {
  return API.patch(`/org/statuses/${id}`, payload);
}

export function deleteOrgStatus(id: string) {
  return API.delete(`/org/statuses/${id}`);
}
