import API from '@/config/apiClient';
import {
  EngagementResponse,
  ListEngagementsResponse,
} from '../types/index.types';

export const getEngagements = async (): Promise<EngagementResponse[]> => {
  const res = await API.get<ListEngagementsResponse, ListEngagementsResponse>(
    `/org/engagements`
  );
  return res.engagements;
};
