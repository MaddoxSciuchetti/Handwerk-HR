import { useMutation } from '@tanstack/react-query';
import { templateMutations } from '../query-options/mutations/template.mutations';

export function useDeleteTemplate() {
  const { mutate: deleteTemplate } = useMutation(templateMutations.delete());
  return {
    deleteTemplate,
  };
}
