import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { workerMutations } from '../../query-options/mutations/worker.mutations';
import { workerQueries } from '../../query-options/queries/worker.queries';
import { LifecycleType } from '../../types/index.types';
import { findEngagementForLifecycle } from '../../utils/workerDetailToTaskView';

const PRIORITIES = [
  { value: 'urgent' as const, label: 'Dringend' },
  { value: 'high' as const, label: 'Hoch' },
  { value: 'medium' as const, label: 'Mittel' },
  { value: 'low' as const, label: 'Niedrig' },
  { value: 'no_priority' as const, label: 'Keine' },
];

type PriorityValue = (typeof PRIORITIES)[number]['value'];

type CreateIssueShortcutModalProps = {
  workerId: string;
  lifecycleType: LifecycleType;
  onClose: () => void;
};

export default function CreateIssueShortcutModal({
  workerId,
  lifecycleType,
  onClose,
}: CreateIssueShortcutModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [statusId, setStatusId] = useState('');
  const [priority, setPriority] = useState<PriorityValue>('no_priority');
  const [assigneeUserId, setAssigneeUserId] = useState('');

  const { data: workerRes } = useQuery(workerQueries.workerDetail(workerId));
  const { data: statuses = [] } = useQuery(
    workerQueries.issueStatuses(workerId)
  );
  const { data: employees = [] } = useQuery(employeeQueries.getEmployees());

  const engagement =
    workerRes?.data &&
    findEngagementForLifecycle(workerRes.data, lifecycleType);

  useEffect(() => {
    if (!statuses.length || statusId) return;
    const def = statuses.find((s) => s.name === 'Offen') ?? statuses[0];
    if (def) setStatusId(def.id);
  }, [statuses, statusId]);

  const { mutate, isPending } = useMutation(
    workerMutations.createWorkerIssue(workerId)
  );

  const handleCreate = () => {
    if (!user?.id || !engagement || !title.trim() || !statusId) return;
    mutate(
      {
        workerEngagementId: engagement.id,
        createdByUserId: user.id,
        statusId,
        title: title.trim(),
        priority,
        ...(assigneeUserId ? { assigneeUserId } : {}),
      },
      { onSuccess: onClose }
    );
  };

  const missingEngagement = workerRes && !engagement;

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
      <h2 className="mb-4 text-lg font-semibold">Neues Issue</h2>
      {missingEngagement ? (
        <p className="text-sm text-muted-foreground">
          Keine passende Phase für diesen Handwerker.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <Label htmlFor="issue-desc">Beschreibung</Label>
              <Textarea
                id="issue-desc"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 min-h-[88px]"
                placeholder="Was ist das Issue?"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusId} onValueChange={setStatusId}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priorität</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as PriorityValue)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Verantwortlich (Lead)</Label>
              <Select
                value={assigneeUserId || '_none'}
                onValueChange={(v) => setAssigneeUserId(v === '_none' ? '' : v)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Person wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">—</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="mt-6 w-full"
            disabled={
              isPending ||
              !title.trim() ||
              !statusId ||
              !engagement ||
              !user?.id
            }
            onClick={handleCreate}
          >
            Issue erstellen
          </Button>
        </>
      )}
    </div>
  );
}
