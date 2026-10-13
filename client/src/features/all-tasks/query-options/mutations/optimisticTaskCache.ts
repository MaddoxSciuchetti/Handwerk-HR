import queryClient from '@/config/query.client';
import { EMPLOYEE_SPECIFICS } from '@/features/employee-overview/consts/query-keys';
import type { EmployeeDataArray } from '@/features/employee-overview/schemas/schema';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import type {
  WorkerDetailResponse,
  WorkerRecord,
} from '@/features/worker-lifecycle/types/index.types';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import type { QueryKey } from '@tanstack/react-query';
import type { IssueStatusValue } from '../../consts/issue-status.consts';
import { FETCHDESCRIPTION } from '../../consts/query.consts';
import { TASK_AUTOMATION_NONE } from '../../consts/task-automation.consts';
import type { IssueAssignee, IssueResponse } from '../../types/index.types';

export type TaskFieldPatch = {
  title?: string;
  workerEngagementId?: string;
  assigneeUserId?: string;
  status?: IssueStatusValue;
  automation?: string;
};

type StatusIssue = { id: string; status: IssueStatusValue };

export type TaskCacheSnapshot = {
  tasks?: IssueResponse[];
  workers?: WorkerRecord[];
  workerDetails: Array<[QueryKey, WorkerDetailResponse | undefined]>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readTaskPatch(data: unknown): TaskFieldPatch {
  if (!isRecord(data)) return {};

  const patch: TaskFieldPatch = {};
  if (typeof data.title === 'string') patch.title = data.title;
  if (typeof data.workerEngagementId === 'string') {
    patch.workerEngagementId = data.workerEngagementId;
  }
  if (typeof data.assigneeUserId === 'string') {
    patch.assigneeUserId = data.assigneeUserId;
  }
  if (typeof data.status === 'string') {
    patch.status = data.status as IssueStatusValue;
  }
  if (typeof data.automation === 'string') patch.automation = data.automation;
  return patch;
}

function storedAutomation(value: string): string | null {
  return value === TASK_AUTOMATION_NONE ? null : value;
}

function assigneeFor(userId: string): IssueAssignee | undefined {
  const employees = queryClient.getQueryData<EmployeeDataArray>([
    EMPLOYEE_SPECIFICS,
  ]);
  const match = employees?.find((employee) => employee.id === userId);
  if (!match) return undefined;
  return {
    id: match.id,
    firstName: match.firstName,
    lastName: match.lastName,
  };
}

function applyIssuePatch(
  issue: IssueResponse,
  patch: TaskFieldPatch
): IssueResponse {
  const nextAssignee =
    patch.assigneeUserId === undefined
      ? issue.assignee
      : (assigneeFor(patch.assigneeUserId) ??
        (issue.assigneeUserId === patch.assigneeUserId ? issue.assignee : null));

  return {
    ...issue,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.workerEngagementId !== undefined
      ? { workerEngagementId: patch.workerEngagementId }
      : {}),
    ...(patch.assigneeUserId !== undefined
      ? { assigneeUserId: patch.assigneeUserId, assignee: nextAssignee }
      : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.automation !== undefined
      ? { automation: storedAutomation(patch.automation) }
      : {}),
  };
}

function withDetailIssues(
  detail: WorkerDetailResponse,
  engagements: WorkerDetailResponse['data']['engagements']
): WorkerDetailResponse {
  return {
    ...detail,
    data: {
      ...detail.data,
      engagements,
    },
  };
}

function patchDetailInPlace(
  detail: WorkerDetailResponse,
  taskId: string,
  patch: TaskFieldPatch
): WorkerDetailResponse {
  return withDetailIssues(
    detail,
    detail.data.engagements.map((engagement) => ({
      ...engagement,
      issues: engagement.issues?.map((issue) =>
        issue.id === taskId ? applyIssuePatch(issue, patch) : issue
      ),
    }))
  );
}

function stripTask(
  detail: WorkerDetailResponse,
  taskId: string,
  patch: TaskFieldPatch,
  capture: (issue: IssueResponse) => void
): WorkerDetailResponse {
  return withDetailIssues(
    detail,
    detail.data.engagements.map((engagement) => ({
      ...engagement,
      issues: engagement.issues?.filter((issue) => {
        if (issue.id !== taskId) return true;
        capture(applyIssuePatch(issue, patch));
        return false;
      }),
    }))
  );
}

function placeTask(
  detail: WorkerDetailResponse,
  issue: IssueResponse
): WorkerDetailResponse {
  return withDetailIssues(
    detail,
    detail.data.engagements.map((engagement) =>
      engagement.id === issue.workerEngagementId
        ? { ...engagement, issues: [...(engagement.issues ?? []), issue] }
        : engagement
    )
  );
}

function issueAlreadyOnEngagement(taskId: string, engagementId: string) {
  return detailQueries().some(([, detail]) =>
    detail?.data.engagements.some(
      (engagement) =>
        engagement.id === engagementId &&
        engagement.issues?.some((issue) => issue.id === taskId)
    )
  );
}

function patchAllDetails(taskId: string, patch: TaskFieldPatch) {
  const entries = detailQueries();
  const staysPut =
    patch.workerEngagementId === undefined ||
    issueAlreadyOnEngagement(taskId, patch.workerEngagementId);

  if (staysPut) {
    writeDetails(entries, (detail) => patchDetailInPlace(detail, taskId, patch));
    return;
  }

  let moved: IssueResponse | undefined;
  const stripped = entries.map(([queryKey, detail]) => {
    if (!detail) return [queryKey, detail] as const;
    return [
      queryKey,
      stripTask(detail, taskId, patch, (issue) => {
        moved = issue;
      }),
    ] as const;
  });

  for (const [queryKey, detail] of stripped) {
    if (!detail) continue;
    const hasTarget = detail.data.engagements.some(
      (engagement) => engagement.id === patch.workerEngagementId
    );
    queryClient.setQueryData(
      queryKey,
      hasTarget && moved ? placeTask(detail, moved) : detail
    );
  }
}

function patchWorkerList(
  workers: WorkerRecord[],
  taskId: string,
  patch: TaskFieldPatch
): WorkerRecord[] {
  if (patch.status === undefined && patch.workerEngagementId === undefined) {
    return workers;
  }

  let moved: StatusIssue | undefined;
  const stripped = workers.map((worker) => ({
    ...worker,
    engagements: worker.engagements.map((engagement) => ({
      ...engagement,
      issues: engagement.issues?.flatMap((issue) => {
        if (issue.id !== taskId) return [issue];
        const next: StatusIssue = {
          id: issue.id,
          status: patch.status ?? issue.status,
        };
        if (
          patch.workerEngagementId !== undefined &&
          engagement.id !== patch.workerEngagementId
        ) {
          moved = next;
          return [];
        }
        return [next];
      }),
    })),
  }));

  if (!moved || patch.workerEngagementId === undefined) return stripped;

  const placed = moved;
  return stripped.map((worker) => ({
    ...worker,
    engagements: worker.engagements.map((engagement) =>
      engagement.id === patch.workerEngagementId
        ? { ...engagement, issues: [...(engagement.issues ?? []), placed] }
        : engagement
    ),
  }));
}

function removeFromWorkerList(
  workers: WorkerRecord[],
  ids: Set<string>
): WorkerRecord[] {
  return workers.map((worker) => ({
    ...worker,
    engagements: worker.engagements.map((engagement) => ({
      ...engagement,
      issues: engagement.issues?.filter((issue) => !ids.has(issue.id)),
    })),
  }));
}

function removeFromDetail(
  detail: WorkerDetailResponse,
  ids: Set<string>
): WorkerDetailResponse {
  return withDetailIssues(
    detail,
    detail.data.engagements.map((engagement) => ({
      ...engagement,
      issues: engagement.issues?.filter((issue) => !ids.has(issue.id)),
    }))
  );
}

function detailQueries() {
  return [
    ...queryClient.getQueriesData<WorkerDetailResponse>({
      queryKey: [WORKERBYID],
    }),
    ...queryClient.getQueriesData<WorkerDetailResponse>({
      queryKey: [ALL_WORKER_DATA, 'detail'],
    }),
  ];
}

function writeDetails(
  entries: Array<[QueryKey, WorkerDetailResponse | undefined]>,
  update: (detail: WorkerDetailResponse) => WorkerDetailResponse
) {
  for (const [queryKey, detail] of entries) {
    if (!detail) continue;
    queryClient.setQueryData(queryKey, update(detail));
  }
}

export async function snapshotTaskCaches(): Promise<TaskCacheSnapshot> {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: [FETCHDESCRIPTION] }),
    queryClient.cancelQueries({ queryKey: [ALL_WORKER_DATA] }),
    queryClient.cancelQueries({ queryKey: [WORKERBYID] }),
  ]);

  return {
    tasks: queryClient.getQueryData<IssueResponse[]>([FETCHDESCRIPTION]),
    workers: queryClient.getQueryData<WorkerRecord[]>([ALL_WORKER_DATA]),
    workerDetails: detailQueries(),
  };
}

export function patchTaskInCaches(taskId: string, patch: TaskFieldPatch) {
  const tasks = queryClient.getQueryData<IssueResponse[]>([FETCHDESCRIPTION]);
  if (tasks) {
    queryClient.setQueryData<IssueResponse[]>(
      [FETCHDESCRIPTION],
      tasks.map((task) => (task.id === taskId ? applyIssuePatch(task, patch) : task))
    );
  }

  const workers = queryClient.getQueryData<WorkerRecord[]>([ALL_WORKER_DATA]);
  if (workers) {
    queryClient.setQueryData(
      [ALL_WORKER_DATA],
      patchWorkerList(workers, taskId, patch)
    );
  }

  patchAllDetails(taskId, patch);
}

export function removeTasksFromCaches(ids: string[]) {
  const idSet = new Set(ids);
  const tasks = queryClient.getQueryData<IssueResponse[]>([FETCHDESCRIPTION]);
  if (tasks) {
    queryClient.setQueryData<IssueResponse[]>(
      [FETCHDESCRIPTION],
      tasks.filter((task) => !idSet.has(task.id))
    );
  }

  const workers = queryClient.getQueryData<WorkerRecord[]>([ALL_WORKER_DATA]);
  if (workers) {
    queryClient.setQueryData(
      [ALL_WORKER_DATA],
      removeFromWorkerList(workers, idSet)
    );
  }

  writeDetails(detailQueries(), (detail) => removeFromDetail(detail, idSet));
}

export function restoreTaskCaches(snapshot: TaskCacheSnapshot) {
  if (snapshot.tasks) {
    queryClient.setQueryData([FETCHDESCRIPTION], snapshot.tasks);
  }
  if (snapshot.workers) {
    queryClient.setQueryData([ALL_WORKER_DATA], snapshot.workers);
  }
  for (const [queryKey, detail] of snapshot.workerDetails) {
    if (detail) queryClient.setQueryData(queryKey, detail);
  }
}
