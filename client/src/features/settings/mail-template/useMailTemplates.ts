import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMailTemplate,
  deleteMailTemplate,
  getMailTemplate,
  listMailTemplates,
  saveMailTemplate,
  updateMailTemplateDetails,
} from './mailTemplate.api';
import type { WelcomeMailSettings } from '@/features/settings/welcome-mail/welcomeMail.api';

export const mailTemplatesKey = ['automation', 'mail-templates'] as const;

export function mailTemplateKey(id: string) {
  return ['automation', 'mail-template', id] as const;
}

export function useMailTemplates() {
  return useQuery({
    queryKey: mailTemplatesKey,
    queryFn: listMailTemplates,
  });
}

export function useMailTemplate(id: string) {
  return useQuery({
    queryKey: mailTemplateKey(id),
    queryFn: () => getMailTemplate(id),
  });
}

export function useCreateMailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMailTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mailTemplatesKey });
    },
  });
}

export function useUpdateMailTemplateDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { name: string; description: string };
    }) => updateMailTemplateDetails(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: mailTemplatesKey });
      void queryClient.invalidateQueries({
        queryKey: mailTemplateKey(variables.id),
      });
    },
  });
}

export function useSaveMailTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WelcomeMailSettings) => saveMailTemplate(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mailTemplateKey(id) });
    },
  });
}

export function useDeleteMailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMailTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mailTemplatesKey });
    },
  });
}
