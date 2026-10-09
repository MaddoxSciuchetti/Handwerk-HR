import { useQuery } from '@tanstack/react-query';
import { getMicrosoft365Automation } from './automation.api';

export function useMicrosoft365Automation() {
  return useQuery({
    queryKey: ['automation', 'microsoft-365'],
    queryFn: getMicrosoft365Automation,
  });
}
