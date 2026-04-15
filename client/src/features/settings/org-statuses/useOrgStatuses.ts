import queryClient from '@/config/query.client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createOrgStatus,
  deleteOrgStatus,
  fetchOrgStatuses,
  updateOrgStatus,
} from './org-status.api';
import { StatusEntityType } from './org-status.types';

function queryKey(entityType: StatusEntityType) {
  return ['org', 'statuses', entityType] as const;
}

export function useOrgStatuses(entityType: StatusEntityType) {
  const statusesQuery = useQuery({
    queryKey: queryKey(entityType),
    queryFn: () => fetchOrgStatuses(entityType),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKey(entityType) });

  const createMutation = useMutation({
    mutationFn: (name: string) => createOrgStatus(entityType, name),
    onSuccess: () => {
      toast.success('Status hinzugefügt.');
      void invalidate();
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || 'Status konnte nicht erstellt werden.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateOrgStatus(id, name),
    onSuccess: () => {
      toast.success('Status gespeichert.');
      void invalidate();
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || 'Status konnte nicht gespeichert werden.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrgStatus,
    onSuccess: () => {
      toast.success('Status gelöscht.');
      void invalidate();
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || 'Status konnte nicht gelöscht werden.');
    },
  });

  return {
    statuses: statusesQuery.data ?? [],
    isLoading: statusesQuery.isLoading,
    isError: statusesQuery.isError,
    refetch: statusesQuery.refetch,
    createStatus: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateStatus: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteStatus: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
