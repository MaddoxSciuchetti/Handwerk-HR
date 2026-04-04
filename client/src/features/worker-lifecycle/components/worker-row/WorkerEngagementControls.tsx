import { CompactSelect } from '@/components/selects/CompactSelect';
import { Button } from '@/components/ui/button';
import useGetOrgUsers from '@/features/employee-overview/hooks/useGetEmployees';
import { orgStatusQueries } from '@/features/org-settings/query-options/queries/orgStatus.queries';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { workerLifecycleMutations } from '@/features/worker-lifecycle/query-options/mutations/worker-lifycycle.mutations';
import type { WorkerEngagement } from '@/features/worker-lifecycle/types/index.types';
import { useMutation, useQuery } from '@tanstack/react-query';
import useEngagementControls from '../../hooks/useEngagementControls';

type WorkerEngagementControlsProps = {
  workerId: string;
  engagement: WorkerEngagement | undefined;
};

/**
 * Row-level controls for the primary (latest) engagement: team lead + project (engagement) status.
 * Lives under the worker lifecycle table row hierarchy next to {@link WorkerItemInfo}.
 */
export function WorkerEngagementControls({
  workerId,
  engagement,
}: WorkerEngagementControlsProps) {
  const { user } = useAuth();
  const { OrgUsers, isLoading: usersLoading } = useGetOrgUsers();
  const { data: projectStatuses = [], isLoading: statusesLoading } = useQuery(
    orgStatusQueries.list('engagement')
  );
  const { mutate, isPending } = useMutation(
    workerLifecycleMutations.updateEngagement(workerId)
  );

  if (!engagement) {
    return (
      <span className="text-xs text-muted-foreground">Kein Engagement</span>
    );
  }
  const { userOptions, statusOptions } = useEngagementControls(
    OrgUsers ?? [],
    projectStatuses
  );

  const patch = (body: { responsibleUserId?: string; statusId?: string }) => {
    mutate({ engagementId: engagement.id, body });
  };

  return (
    <div className="flex flex-nowrap items-center justify-center gap-4">
      <div className="flex min-w-0 flex-col items-center gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Teamlead
        </span>
        <div className="flex flex-nowrap items-center justify-center gap-1">
          <CompactSelect
            aria-label="Teamlead"
            value={engagement.responsibleUser.id}
            options={userOptions}
            disabled={usersLoading || isPending}
            onValueChange={(responsibleUserId) => patch({ responsibleUserId })}
            triggerClassName="max-w-[11rem]"
          />
          {user?.id ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 shrink-0 px-2 text-xs"
              disabled={isPending || engagement.responsibleUser.id === user.id}
              onClick={(e) => {
                e.stopPropagation();
                patch({ responsibleUserId: user.id });
              }}
            >
              Ich
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex min-w-0 flex-col items-center gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Projekt-Status
        </span>
        <CompactSelect
          aria-label="Projekt-Status"
          value={engagement.engagementStatus.id}
          options={statusOptions}
          disabled={statusesLoading || isPending}
          onValueChange={(statusId) => patch({ statusId })}
          triggerClassName="max-w-[11rem]"
        />
      </div>
    </div>
  );
}
