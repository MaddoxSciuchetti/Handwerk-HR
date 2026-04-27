import FormFields from '@/components/form/FormFields';
import FormSelectOptions from '@/components/form/FormSelectOptions';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/selfmade/button';
import { FormWrapper } from '@/components/ui/selfmade/form-wrapper';
import { Check, X } from 'lucide-react';
import {
  DEFAULT_TEMPLATE_PRIORITY,
  TEMPLATE_PRIORITY_OPTIONS,
} from '../../consts/priority-options';
import { useSubmitTasks } from '../../hooks/useSubmitTasks';
import { TemplateTaskFormValues } from '../../types/index.types';
import { SidebarAside } from './task-sidebar/SidebarAside';
import SidebarContent from './task-sidebar/SidebarContent';
import SidebarFooter from './task-sidebar/SidebarFooter';
import SidebarHeader from './task-sidebar/SidebarHeader';
import { SidebarPanel } from './task-sidebar/SidebarPanel';

const EMPTY_TEMPLATE_TASK: TemplateTaskFormValues = {
  taskId: '',
  taskName: '',
  taskDescription: '',
  defaultPriority: DEFAULT_TEMPLATE_PRIORITY,
  orderIndex: 0,
};

type TaskSidebarProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  templateId: string;
  templateTaskState: 'create' | 'edit';
  editTemplateTask: TemplateTaskFormValues;
};
export function TaskSidebar({
  isOpen,
  setIsOpen,
  templateId,
  templateTaskState,
  editTemplateTask,
}: TaskSidebarProps) {
  const { register, errors, onSubmit, control } = useSubmitTasks(
    editTemplateTask.taskId,
    templateId,
    templateTaskState,
    editTemplateTask
  );

  return (
    <SidebarAside isOpen={isOpen}>
      <SidebarPanel>
        <SidebarHeader>
          <Label>
            {templateTaskState === 'create'
              ? 'Erstelle deine Aufgabe'
              : 'Bearbeite deine Aufgabe'}
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
          <SidebarContent className="mt-5 p-6 flex flex-col gap-2">
            <FormFields
              errors={errors}
              register={register}
              name="taskName"
              label="Name der Aufgabe"
              labelClassName="typo-body-base"
            />
            <FormFields
              errors={errors}
              register={register}
              name="taskDescription"
              label="Beschreibung der Aufgabe"
              labelClassName="typo-body-base"
            />
            <FormSelectOptions
              errors={errors}
              control={control}
              data={TEMPLATE_PRIORITY_OPTIONS}
              name="defaultPriority"
              label="Standard-Priorität"
              labelClassName="typo-body-base"
              placeholder="Priorität wählen"
            />
          </SidebarContent>
          <SidebarFooter className="p-6">
            <Button type="submit">
              <Check className="h-4 w-4" aria-hidden /> Speichern
            </Button>
          </SidebarFooter>
        </FormWrapper>
      </SidebarPanel>
    </SidebarAside>
  );
}
