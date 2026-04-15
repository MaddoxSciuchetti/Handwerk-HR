import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { templateMutations } from '../query-options/mutations/template.mutations';

export type TemplateSubmission = {
  templateName: string;
  templateDescription: string;
  type?: string;
};

export function useSubmitTemplate() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TemplateSubmission>({
    resolver: zodResolver(
      z.object({
        templateName: z.string().min(1),
        templateDescription: z.string().min(1),
        type: z.string().min(1).optional(),
      })
    ),
  });

  const { mutate: createTemplate } = useMutation(
    templateMutations.createTemplate()
  );

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    createTemplate(data, {
      onSuccess: () => {
        toast.success('Template created successfully');
      },
      onError: () => {
        toast.error('Failed to create template');
      },
    });
  });

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
  };
}
