import FormFields from '@/components/form/FormFields';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarFooter from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarFooter';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import {
  useCreateMailTemplate,
  useUpdateMailTemplateDetails,
} from '@/features/settings/mail-template/useMailTemplates';

export type MailTemplateEditState = {
  id: string;
  name: string;
  description: string;
};

type MailTemplateSidebarProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  mode: 'create' | 'edit';
  editState: MailTemplateEditState;
};

const schema = z.object({
  name: z.string().min(1, { message: 'Name ist erforderlich' }),
  description: z.string(),
});

type MailTemplateFormValues = z.infer<typeof schema>;

export function MailTemplateSidebar({
  isOpen,
  setIsOpen,
  mode,
  editState,
}: MailTemplateSidebarProps) {
  const navigate = useNavigate();
  const create = useCreateMailTemplate();
  const update = useUpdateMailTemplateDetails();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MailTemplateFormValues>({
    defaultValues: {
      name: mode === 'edit' ? editState.name : '',
      description: mode === 'edit' ? editState.description : '',
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit((values) => {
    const input = {
      name: values.name.trim(),
      description: values.description.trim(),
    };
    if (mode === 'create') {
      create.mutate(input, {
        onSuccess: (template) => {
          toast.success('E-Mail erstellt');
          setIsOpen(false);
          void navigate({
            to: '/settings/mail-templates/$id',
            params: { id: template.id },
          });
        },
        onError: () => {
          toast.error('E-Mail konnte nicht erstellt werden');
        },
      });
      return;
    }
    update.mutate(
      { id: editState.id, input },
      {
        onSuccess: () => {
          toast.success('E-Mail gespeichert');
          setIsOpen(false);
        },
        onError: () => {
          toast.error('E-Mail konnte nicht gespeichert werden');
        },
      }
    );
  });

  return (
    <SidebarAside
      className="p-2"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    >
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          <Label className="typo-body-lg font-bold">
            {mode === 'create' ? 'E-Mail erstellen' : 'E-Mail bearbeiten'}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Schließen"
            className="rounded-full"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </SidebarHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <SidebarContent className="mt-2 flex flex-col gap-4 p-6">
            <FormFields
              errors={errors}
              register={register}
              name="name"
              label="Name der E-Mail"
              labelClassName="typo-body-base"
            />
          </SidebarContent>
          <SidebarFooter className="p-6">
            <Button
              type="submit"
              className="rounded-full"
              disabled={create.isPending || update.isPending}
            >
              <Check className="h-4 w-4" aria-hidden /> Speichern
            </Button>
          </SidebarFooter>
        </form>
      </SidebarPanel>
    </SidebarAside>
  );
}
