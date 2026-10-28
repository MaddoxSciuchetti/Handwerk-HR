import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createPersonnelFolder,
  movePersonnelDocument,
  deletePersonnelFolder,
  type MovePersonnelDocumentInput,
  deletePersonnelDocument,
  getPersonnelDocuments,
  uploadPersonnelDocument,
  type PersonnelLibrary,
} from '../api/personnelDocuments.api';
import { HISTORYDATA, PERSONNEL_DOCUMENTS } from '../consts/query-key.consts';

export function usePersonnelDocuments(workerId: string) {
  return useQuery({
    queryKey: [PERSONNEL_DOCUMENTS, workerId],
    staleTime: 30_000,
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
            current?.documents.filter(
              (document) => document.id !== documentId
            ) ?? [],
          folders: current?.folders ?? [],
          hiddenFolders: current?.hiddenFolders ?? [],
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

export function useMovePersonnelDocument(workerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MovePersonnelDocumentInput) =>
      movePersonnelDocument(workerId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [PERSONNEL_DOCUMENTS, workerId],
        }),
        queryClient.invalidateQueries({ queryKey: [HISTORYDATA, workerId] }),
      ]);
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Datei konnte nicht verschoben werden.'),
  });
}

export function useDeletePersonnelFolder(workerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { folderId: string; confirmed: boolean }) =>
      deletePersonnelFolder(workerId, input.folderId, input.confirmed),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [PERSONNEL_DOCUMENTS, workerId],
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Ordner konnte nicht gelöscht werden.'),
  });
}
