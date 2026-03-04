import API from '@/config/apiClient';
import { AgentResponse } from '../types/agent.types';

export const sendAgentMessage = (data: string): Promise<AgentResponse> => {
  return API.post<AgentResponse, AgentResponse>('/user/sendAgentMessage', {
    agentMessage: data,
  });
};

export const fetchAgentMessage = () => {
  return API.get('/user/getResponse');
};
