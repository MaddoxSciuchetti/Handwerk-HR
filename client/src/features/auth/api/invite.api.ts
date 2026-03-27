import API from '@/config/apiClient';
import { AcceptInviteResponse, InviteDetails } from '../types/auth.types';
import { AcceptInviteFormValues } from '../schemas/auth.schemas';

export type CreateInviteRequest = {
  email: string;
  roleId?: string;
};

export const sendOrgInvite = async (
  data: CreateInviteRequest
): Promise<{ message: string; inviteId: string }> => {
  return API.post('/org/invite', data);
};

export const getInviteDetails = async (token: string): Promise<InviteDetails> => {
  return API.get(`/invites/${token}`);
};

export const acceptInvite = async (
  token: string,
  data: AcceptInviteFormValues
): Promise<AcceptInviteResponse> => {
  return API.post(`/invites/${token}/accept`, data);
};
