import FormFields from '@/components/form/FormFields';
import FormSelectOptions from '@/components/form/FormSelectOptions';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { TaskCommentBox } from '@/features/all-tasks/components/TaskCommentBox';
import { TaskStatusSelect } from '@/features/all-tasks/components/ui/TaskStatusSelect';
import { useSaveTaskComment } from '@/features/all-tasks/hooks/useSaveTaskComment';
import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarFooter from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarFooter';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import TaskHistory from '@/features/worker-task-management/components/tasks/task-sidebar/task-history/TaskHistory';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useFetchEngagements } from '../hooks/useFetchEngagements';
import { useTasks } from '../hooks/useTasks';
import type { TaskEditState } from '../hooks/useTaskSidebar';

type TaskSidebarProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
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
    commentOptions
  );

  const { data: employees = [] } = useQuery(employeeQueries.getEmployees());
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

  const engagementOptions = useMemo(
    () =>
      engagements.map((e) => ({
        value: e.id,
        label: `${e.workerFirstName} ${e.workerLastName} — ${e.type}`,
      })),
    [engagements]
  );

  return (
    <SidebarAside className="p-2" isOpen={isOpen}>
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          <Label className="text-base font-semibold">
            {taskState === 'edit' ? 'Aufgabe bearbeiten' : 'Aufgabe'}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-2xl"
            aria-label="Schließen"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </SidebarHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SidebarContent className="mt-2 flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
            <FieldGroup className="gap-4 pb-8">
              <FormFields
                errors={errors}
                register={register}
                name="title"
                label="Aufgabe"
                placeholder="Titel"
              />
              <FormSelectOptions
                name="workerEngagementId"
                control={control}
                data={engagementOptions}
                placeholder="Handwerker"
                errors={errors}
                label="Handwerker"
              />
              <FormSelectOptions
                name="assigneeUserId"
                control={control}
                data={ownerOptions}
                placeholder="Zuständig"
                errors={errors}
                label="Zuständigkeit"
              />
              <TaskStatusSelect control={control} errors={errors} />

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
            </FieldGroup>
          </SidebarContent>
          <SidebarFooter className="shrink-0 border-0 p-6">
            <Button
              type="submit"
              className="rounded-2xl"
              disabled={isSubmitting}
            >
              {taskState === 'edit' ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </SidebarFooter>
        </form>
      </SidebarPanel>
    </SidebarAside>
  );
}
