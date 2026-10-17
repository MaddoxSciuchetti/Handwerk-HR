import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deletePersonnelDocument,
  getPersonnelDocuments,
  uploadPersonnelDocument,
  type PersonnelDocument,
} from '../api/personnelDocuments.api';
import { PERSONNEL_DOCUMENTS } from '../consts/query-key.consts';
import type { PersonnelDocumentName } from '../personnel-documents/personnelDocumentNames';

export function usePersonnelDocuments(workerId: string) {
  return useQuery({
    queryKey: [PERSONNEL_DOCUMENTS, workerId],
    queryFn: () => getPersonnelDocuments(workerId),
  });
}

export function useUploadPersonnelDocument(workerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      engagementId: string;
      name: PersonnelDocumentName;
      file: File;
    }) =>
      uploadPersonnelDocument(
        workerId,
        input.engagementId,
        input.name,
        input.file
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [PERSONNEL_DOCUMENTS, workerId],
      });
    },
    onError: () => {
      toast.error('Dokument konnte nicht hochgeladen werden.');
    },
  });
}

export function useDeletePersonnelDocument(workerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      deletePersonnelDocument(workerId, documentId),
    onMutate: async (documentId) => {
      await queryClient.cancelQueries({
        queryKey: [PERSONNEL_DOCUMENTS, workerId],
      });
      const previous = queryClient.getQueryData<PersonnelDocument[]>([
        PERSONNEL_DOCUMENTS,
        workerId,
      ]);
      queryClient.setQueryData<PersonnelDocument[]>(
        [PERSONNEL_DOCUMENTS, workerId],
        (current) => current?.filter((document) => document.id !== documentId) ?? []
      );
      return { previous };
    },
    onError: (_error, _documentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [PERSONNEL_DOCUMENTS, workerId],
          context.previous
        );
      }
      toast.error('Dokument konnte nicht gelöscht werden.');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: [PERSONNEL_DOCUMENTS, workerId],
      });
    },
  });
}
