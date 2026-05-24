import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { templateMutations } from '../query-options/mutations/template.mutations';

export type TemplateSubmission = {
  templateId?: string;
  name: string;
  description: string | null;
};

export function useSubmitTemplate(
  templateState: 'create' | 'edit',
  templateId: string,
  initialValues: TemplateSubmission
) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TemplateSubmission>({
    defaultValues: initialValues,
    resolver: zodResolver(
      z.object({
        templateId: z.string().optional(),
        name: z.string().min(1, { message: 'Name ist erforderlich' }),
        description: z
          .string()
          .min(1, { message: 'Beschreibung ist erforderlich' })
          .nullable(),
      })
    ),
  });

  const { mutate: createTemplate } = useMutation(
    templateMutations.createTemplate()
  );

  const { mutate: updateTemplate } = useMutation(templateMutations.update());

  const onSubmit = handleSubmit((data) => {
    if (templateState === 'create') {
      createTemplate(data, {
        onSuccess: () => {
          toast.success('Template created successfully');
        },
        onError: () => {
          toast.error('Failed to create template');
        },
      });
    } else {
      updateTemplate(
        { templateId, data },
        {
          onSuccess: () => {
            toast.success('Template updated successfully');
          },
          onError: () => {
            toast.error('Failed to update template');
          },
        }
      );
    }
  });

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
  };
}
