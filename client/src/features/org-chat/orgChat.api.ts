import API from '@/config/apiClient';

export type OrgChatAuthor = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type OrgChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  user: OrgChatAuthor;
};

export type PostOrgChatResult = {
  message: OrgChatMessage;
  mailFailed: boolean;
};

export const getOrgChat = async (): Promise<OrgChatMessage[]> =>
  API.get('/chat');

export const postOrgChat = async (payload: {
  body: string;
  mentionUserIds?: string[];
}): Promise<PostOrgChatResult> => API.post('/chat', payload);
