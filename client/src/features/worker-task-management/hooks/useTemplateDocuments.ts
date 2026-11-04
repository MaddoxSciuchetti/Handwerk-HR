import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTemplateDocument,
  getTemplateDocument,
  listTemplateDocuments,
  saveTemplateDocument,
  syncTemplateDocument,
  type TemplateDocumentDraft,
  type TemplateDocumentLink,
} from '../api/templateDocument.api';

export function templateDocumentsKey(workerId: string, engagementId: string) {
  return ['template-documents', workerId, engagementId] as const;
}

export function templateDocumentKey(
  workerId: string,
  engagementId: string,
  documentId: string
) {
  return ['template-document', workerId, engagementId, documentId] as const;
}

export function useTemplateDocuments(workerId: string, engagementId: string) {
  return useQuery({
    queryKey: templateDocumentsKey(workerId, engagementId),
    queryFn: () => listTemplateDocuments(workerId, engagementId),
    enabled: Boolean(workerId && engagementId),
  });
}

export function useTemplateDocument(
  workerId: string,
  engagementId: string,
  documentId: string | null
) {
  return useQuery({
    queryKey: templateDocumentKey(workerId, engagementId, documentId ?? ''),
    queryFn: () =>
      getTemplateDocument(workerId, engagementId, documentId ?? ''),
    enabled: Boolean(documentId),
  });
}

function cacheLink(
  queryClient: ReturnType<typeof useQueryClient>,
  workerId: string,
  engagementId: string,
  saved: TemplateDocumentDraft
) {
  queryClient.setQueryData<TemplateDocumentDraft>(
    templateDocumentKey(workerId, engagementId, saved.id),
    saved
  );
  queryClient.setQueryData<TemplateDocumentLink[]>(
    templateDocumentsKey(workerId, engagementId),
    (current) => {
      const next = {
        id: saved.id,
        engagementId: saved.engagementId,
        masterId: saved.masterId,
        name: saved.name,
        kind: saved.kind,
      };
      if (!current) return [next];
      if (current.some((item) => item.id === saved.id)) return current;
      return [...current, next];
    }
  );
}

function cacheDraft(
  queryClient: ReturnType<typeof useQueryClient>,
  workerId: string,
  engagementId: string,
  saved: TemplateDocumentDraft
) {
  queryClient.setQueryData(
    templateDocumentKey(workerId, engagementId, saved.id),
    saved
  );
}

export type BatchDocumentResult = {
  ok: TemplateDocumentDraft[];
  failed: number;
};

export function useCreateTemplateDocument(
  workerId: string,
  engagementId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (masterId: string) =>
      createTemplateDocument(workerId, engagementId, masterId),
    onSuccess: (saved) => {
      cacheLink(queryClient, workerId, engagementId, saved);
    },
  });
}

export function useCreateTemplateDocuments(
  workerId: string,
  engagementId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (masterIds: string[]): Promise<BatchDocumentResult> => {
      const ok: TemplateDocumentDraft[] = [];
      let failed = 0;
      for (const masterId of masterIds) {
        try {
          const saved = await createTemplateDocument(
            workerId,
            engagementId,
            masterId
          );
          cacheLink(queryClient, workerId, engagementId, saved);
          ok.push(saved);
        } catch {
          failed += 1;
        }
      }
      return { ok, failed };
    },
  });
}

export function useSaveTemplateDocument(
  workerId: string,
  engagementId: string,
  documentId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Record<string, string>) =>
      saveTemplateDocument(workerId, engagementId, documentId, values),
    onSuccess: (saved) => cacheDraft(queryClient, workerId, engagementId, saved),
  });
}

export function useSyncTemplateDocument(
  workerId: string,
  engagementId: string,
  documentId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => syncTemplateDocument(workerId, engagementId, documentId),
    onSuccess: (saved) => cacheDraft(queryClient, workerId, engagementId, saved),
  });
}

export function useSyncTemplateDocuments(
  workerId: string,
  engagementId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentIds: string[]): Promise<BatchDocumentResult> => {
      const ok: TemplateDocumentDraft[] = [];
      let failed = 0;
      for (const documentId of documentIds) {
        try {
          const saved = await syncTemplateDocument(
            workerId,
            engagementId,
            documentId
          );
          cacheDraft(queryClient, workerId, engagementId, saved);
          ok.push(saved);
        } catch {
          failed += 1;
        }
      }
      return { ok, failed };
    },
  });
}
