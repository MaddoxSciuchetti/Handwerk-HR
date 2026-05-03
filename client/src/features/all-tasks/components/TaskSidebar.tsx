import FormFields from '@/components/form/FormFields';
import FormSelectOptions from '@/components/form/FormSelectOptions';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/selfmade/button';
import { FormWrapper } from '@/components/ui/selfmade/form-wrapper';
import { TaskCommentBox } from '@/features/all-tasks/components/TaskCommentBox';
import { useSaveTaskComment } from '@/features/all-tasks/hooks/useSaveTaskComment';
import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import { fetchOrgStatuses } from '@/features/settings/org-statuses/org-status.api';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarFooter from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarFooter';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import TaskHistory from '@/features/worker-task-management/components/tasks/task-sidebar/task-history/TaskHistory';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFetchEngagements } from '../hooks/useFetchEngagements';
import { useTasks } from '../hooks/useTasks';
import type { TaskEditState } from '../hooks/useTaskSidebar';

type TaskSidebarProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  taskState: 'create' | 'edit';
  taskEditState: TaskEditState;
};

export function TaskSidebar({
  isOpen,
  setIsOpen,
  taskState,
  taskEditState,
}: TaskSidebarProps) {
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const saveComment = useSaveTaskComment();

  useEffect(() => {
    setCommentText('');
    setEditingCommentId(null);
  }, [taskEditState.taskId, taskState]);

  const commentOptions =
    taskState === 'edit'
      ? {
            getCommentDraft: () => ({
              body: commentText,
              commentId: editingCommentId,
            }),
            persistComment: async (args: {
              taskId: string;
              body: string;
              commentId: string | null;
            }) => {
              await saveComment.mutateAsync(args);
              setCommentText('');
              setEditingCommentId(null);
            },
          }
      : undefined;

  const { register, control, errors, onSubmit, isTaskSaving } = useTasks(
    taskEditState,
    taskState,
    setIsOpen,
    commentOptions,
  );

  const { data: employees = [] } = useQuery(employeeQueries.getEmployees());
  const { data: statuses = [] } = useQuery({
    queryKey: ['org', 'statuses', 'issue'],
    queryFn: () => fetchOrgStatuses('issue'),
    enabled: isOpen,
  });
  const { data: engagements = [] } = useFetchEngagements();
  const { user } = useAuth();

  const isSubmitting = isTaskSaving || saveComment.isPending;

  const handleEditComment = (commentId: string, body: string) => {
    setEditingCommentId(commentId);
    setCommentText(body);
  };

  const handleCancelCommentEdit = () => {
    setEditingCommentId(null);
    setCommentText('');
  };

  const ownerOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.firstName} ${e.lastName}`,
      })),
    [employees]
  );

  const statusOptions = useMemo(
    () =>
      statuses.map((s) => ({
        value: s.id,
        label: s.name,
      })),
    [statuses]
  );

  const engagementOptions = useMemo(
    () =>
      engagements.map((e) => ({
        value: e.id,
        label: `${e.workerFirstName} ${e.workerLastName} — ${e.type}`,
      })),
    [engagements]
  );

  return (
    <>
      <SidebarAside className="p-2" isOpen={isOpen}>
        <SidebarPanel className="w-full">
          <SidebarHeader className="flex items-center justify-between p-6">
            <Label className="typo-body-lg font-bold">
              {taskState === 'edit' ? 'Aufgabe bearbeiten' : 'Aufgabe'}
            </Label>
            <Button
              type="button"
              size="icon"
              aria-label="Schließen"
              className="bg-transparent text-foreground shadow-none hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </SidebarHeader>
          <FormWrapper
            onSubmit={onSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SidebarContent className="mt-5 flex flex-col gap-4 p-6">
              <FormFields
                errors={errors}
                register={register}
                name="title"
                label="Aufgabe"
                labelClassName="typo-body-base"
                placeholder="Titel"
              />
              <FormSelectOptions
                name="workerEngagementId"
                control={control}
                data={engagementOptions}
                placeholder="Engagement"
                errors={errors}
                label="Engagement"
                labelClassName="typo-body-base"
              />
              <FormSelectOptions
                name="assigneeUserId"
                control={control}
                data={ownerOptions}
                placeholder="Zuständig"
                errors={errors}
                label="Zuständigkeit"
                labelClassName="typo-body-base"
              />
              <FormSelectOptions
                name="statusId"
                control={control}
                data={statusOptions}
                placeholder="Status"
                errors={errors}
                label="Status"
                labelClassName="typo-body-base"
              />

              {taskState === 'edit' && taskEditState.taskId ? (
                <>
                  <TaskCommentBox
                    commentText={commentText}
                    onCommentTextChange={setCommentText}
                    editingCommentId={editingCommentId}
                    onCancelEdit={handleCancelCommentEdit}
                    disabled={isSubmitting}
                  />
                  <TaskHistory
                    taskId={taskEditState.taskId}
                    currentUserId={user?.id}
                    onEditComment={handleEditComment}
                  />
                </>
              ) : null}
            </SidebarContent>
            <SidebarFooter className="p-6">
              <Button type="submit" disabled={isSubmitting}>
                {taskState === 'edit' ? 'Speichern' : 'Hinzufügen'}
              </Button>
            </SidebarFooter>
          </FormWrapper>
        </SidebarPanel>
      </SidebarAside>
    </>
  );
}
