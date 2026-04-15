export type StatusEntityType = 'issue' | 'engagement';

export type OrgStatus = {
  id: string;
  name: string;
  color: string | null;
  orderIndex: number;
  isDefault: boolean;
  usageCount: number;
};

export type ListOrgStatusesResponse = {
  statuses: OrgStatus[];
};
