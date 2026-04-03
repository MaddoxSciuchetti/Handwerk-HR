import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import useIssueMutations from '../../hooks/useIssueMutations';
import useIssues from '../../hooks/useIssues';
import { workerMutations } from '../../query-options/mutations/worker.mutations';
import { LifecycleType } from '../../types/index.types';
import { findEngagementForLifecycle } from '../../utils/workerDetailToTaskView';
import IssueSelects from './IssueSelects';

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

  const { workerRes, statuses, employees } = useIssueMutations(workerId);

  const engagement =
    workerRes?.data &&
    findEngagementForLifecycle(workerRes.data, lifecycleType);

  const {
    title,
    statusId,
    priority,
    assigneeUserId,
    setTitle,
    setPriority,
    setStatusId,
    setAssigneeUserId,
  } = useIssues(statuses ?? []);

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
            <Label htmlFor="issue-desc">Beschreibung</Label>
            <Textarea
              id="issue-desc"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 min-h-[88px]"
              placeholder="Was ist das Issue?"
            />
            <IssueSelects
              statusId={statusId}
              setStatusId={setStatusId}
              statuses={statuses}
              priority={priority}
              setPriority={setPriority}
              assigneeUserId={assigneeUserId}
              setAssigneeUserId={setAssigneeUserId}
              employees={employees}
            />
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
