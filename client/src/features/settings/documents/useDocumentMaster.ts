import { useQuery } from '@tanstack/react-query';
import { getDocumentMaster } from './documentMasters.api';
import { DOCUMENT_MASTERS_KEY } from './documentMaster.keys';

export function useDocumentMaster(id: string) {
  return useQuery({
    queryKey: [DOCUMENT_MASTERS_KEY, id],
    queryFn: () => getDocumentMaster(id),
  });
}
