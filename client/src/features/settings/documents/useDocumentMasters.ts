import { useQuery } from '@tanstack/react-query';
import { listDocumentMasters } from './documentMasters.api';
import { DOCUMENT_MASTERS_KEY } from './documentMaster.keys';

export function useDocumentMasters() {
  return useQuery({
    queryKey: [DOCUMENT_MASTERS_KEY],
    queryFn: listDocumentMasters,
  });
}
