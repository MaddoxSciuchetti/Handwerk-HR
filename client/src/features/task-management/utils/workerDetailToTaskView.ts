import type { LifecycleType } from '@/features/task-management/types/index.types';
import type { TaskStatus } from '@/features/task-management/utils/selectOptionTernary';
import { TASK_STATUSES } from '@/features/task-management/utils/selectOptionTernary';
import type {
  EngagementType,
  WorkerDetailResponse,
} from '@/features/worker-lifecycle/types/index.types';
import type { DescriptionFieldResponse } from '@/types/api.types';

type V2Issue = {
  id: string;
  title: string;
  description?: string | null;
  templateItemId?: string | null;
  assignee?: { id: string; firstName: string; lastName: string } | null;
  issueStatus?: { id: string; name: string } | null;
};

function engagementToLifecycle(
  type: EngagementType | undefined
): LifecycleType {
  if (type === 'offboarding') return 'offboarding';
  return 'onboarding';
}

export function findEngagementForLifecycle(
  data: WorkerDetailResponse['data'],
  lifecycleType: LifecycleType
) {
  return data.engagements.find(
    (e) => engagementToLifecycle(e.type) === lifecycleType
  );
}

function mapIssueStatus(name: string | undefined): TaskStatus {
  const n = (name ?? '').toLowerCase();
  if (n.includes('erledigt')) return 'erledigt';
  if (n.includes('bearbeitung')) return 'in_bearbeitung';
  const direct = TASK_STATUSES.find((s) => n === s || n.includes(s));
  if (direct) return direct;
  return 'offen';
}

function ownerLabel(
  a: { firstName: string; lastName: string } | null | undefined
) {
  if (!a) return '';
  return `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim();
}

export function workerDetailToDescriptionFieldResponse(
  res: WorkerDetailResponse,
  lifecycleType: LifecycleType
): DescriptionFieldResponse {
  const w = res.data;
  const engagement = findEngagementForLifecycle(w, lifecycleType);
  const issues = (engagement?.issues ?? []) as V2Issue[];

  const fields = issues.map((issue) => {
    const body = [issue.title, issue.description].filter(Boolean).join('\n\n');
    return {
      id: issue.id,
      form_field_id: 0,
      description: body || issue.title,
      officialOwner: ownerLabel(issue.assignee),
      substituteOwner: '',
      owner_id: issue.assignee?.id ?? '',
      is_substitute: false,
      status: mapIssueStatus(issue.issueStatus?.name),
      statusId: issue.issueStatus?.id,
      issueStatusName: issue.issueStatus?.name ?? null,
      edit: '',
      templateItemId: issue.templateItemId ?? null,
    };
  });

  return {
    worker: {
      id: w.id,
      vorname: w.firstName,
      nachname: w.lastName,
      email: w.email,
      geburtsdatum: w.birthday,
      adresse: null,
      eintrittsdatum: w.entryDate,
      austrittsdatum: w.exitDate,
      position: w.position,
    },
    form: {
      id: engagement?.id ?? w.id,
      type: lifecycleType,
      fields,
    },
  };
}
