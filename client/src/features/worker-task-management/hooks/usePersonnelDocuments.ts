import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createPersonnelFolder,
  deletePersonnelDocument,
  getPersonnelDocuments,
  uploadPersonnelDocument,
  type PersonnelLibrary,
} from '../api/personnelDocuments.api';
import { PERSONNEL_DOCUMENTS } from '../consts/query-key.consts';

export function usePersonnelDocuments(workerId: string) {
  return useQuery({
    queryKey: [PERSONNEL_DOCUMENTS, workerId],
    queryFn: () => getPersonnelDocuments(workerId),
  });
}

export function useCreatePersonnelFolder(workerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { engagementId: string; label: string }) =>
      createPersonnelFolder(workerId, input.engagementId, input.label),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [PERSONNEL_DOCUMENTS, workerId],
      });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Ordner konnte nicht angelegt werden.');
    },
  });
}

export function useUploadPersonnelDocument(workerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      engagementId: string;
      name: string;
      folderId?: string;
      file: File;
    }) => uploadPersonnelDocument(workerId, input.engagementId, input),
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
      const previous = queryClient.getQueryData<PersonnelLibrary>([
        PERSONNEL_DOCUMENTS,
        workerId,
      ]);
      queryClient.setQueryData<PersonnelLibrary>(
        [PERSONNEL_DOCUMENTS, workerId],
        (current) => ({
          documents:
            current?.documents.filter((document) => document.id !== documentId) ??
            [],
          folders: current?.folders ?? [],
        })
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
