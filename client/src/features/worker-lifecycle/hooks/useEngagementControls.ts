import { OrgUsersArray } from '@/features/employee-overview/schemas/schema';
import { OrgStatusRow } from '@/features/org-settings/api/orgStatus.api';

function useEngagementControls(
  OrgUsers: OrgUsersArray,
  projectStatuses: OrgStatusRow[]
) {
  const userOptions = (OrgUsers ?? []).map((u) => ({
    value: u.id,
    label: `${u.firstName} ${u.lastName}`.trim() || u.email,
  }));

  const statusOptions = projectStatuses.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  return { userOptions, statusOptions };
}

export default useEngagementControls;
