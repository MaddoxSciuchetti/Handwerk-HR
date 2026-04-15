import FormFields from '@/components/form/FormFields';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/selfmade/button';
import { FormWrapper } from '@/components/ui/selfmade/form-wrapper';
import { Check, X } from 'lucide-react';
import { useSubmitTasks } from '../../hooks/useSubmitTasks';
import { SidebarAside } from './task-sidebar/SidebarAside';
import SidebarContent from './task-sidebar/SidebarContent';
import SidebarFooter from './task-sidebar/SidebarFooter';
import SidebarHeader from './task-sidebar/SidebarHeader';
import { SidebarPanel } from './task-sidebar/SidebarPanel';

type TaskSidebarProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  templateId: string;
};
export function TaskSidebar({ isOpen, setIsOpen, templateId }: TaskSidebarProps) {
  const { register, handleSubmit, errors, onSubmit } =
    useSubmitTasks(templateId);
  return (
    <SidebarAside isOpen={isOpen}>
      <SidebarPanel>
        <SidebarHeader>
          <Label>Erstelle deine Aufgabe</Label>
          <Button type="button" onClick={() => setIsOpen(false)}>
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
              label="Name der Aufgabe"
              labelClassName="typo-body-base"
            />
            <FormFields
              errors={errors}
              register={register}
              name="defaultPriority"
              label="Name der Aufgabe"
              labelClassName="typo-body-base"
            />
            <FormFields
              errors={errors}
              register={register}
              name="defaultStatus"
              label="Name der Aufgabe"
              labelClassName="typo-body-base"
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
