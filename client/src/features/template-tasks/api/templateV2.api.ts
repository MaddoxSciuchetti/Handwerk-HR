import API from '@/config/apiClient';

export type EngagementTemplateTypeV2 =
  | 'onboarding'
  | 'offboarding'
  | 'transfer';

export type IssueTemplateListItem = {
  id: string;
  name: string;
  description: string | null;
  type: EngagementTemplateTypeV2;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  _count: { items: number };
};

export type TemplateItemV2 = {
  id: string;
  title: string;
  description: string | null;
  defaultPriority: string | null;
  defaultStatus: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type IssueTemplateDetail = Omit<
  IssueTemplateListItem,
  '_count' | 'createdBy'
> & {
  createdBy: IssueTemplateListItem['createdBy'];
  items: TemplateItemV2[];
};

export type IssueTemplateCreated = {
  id: string;
  name: string;
  description: string | null;
  type: EngagementTemplateTypeV2;
  isActive: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export const fetchIssueTemplates = async (): Promise<IssueTemplateListItem[]> => {
  return API.get('/template/') as Promise<IssueTemplateListItem[]>;
};

export const fetchIssueTemplateById = async (
  id: string
): Promise<IssueTemplateDetail> => {
  return API.get(`/template/${id}`) as Promise<IssueTemplateDetail>;
};

export const createIssueTemplate = async (body: {
  name: string;
  description?: string;
  type: EngagementTemplateTypeV2;
}): Promise<IssueTemplateCreated> => {
  return API.post('/template/', body) as Promise<IssueTemplateCreated>;
};

export const deleteIssueTemplate = async (id: string): Promise<void> => {
  await API.delete(`/template/${id}`);
};

export const createTemplateItemV2 = async (
  templateId: string,
  body: { title: string; description?: string; orderIndex?: number }
): Promise<TemplateItemV2> => {
  return API.post(
    `/template/${templateId}/task`,
    body
  ) as Promise<TemplateItemV2>;
};

export const deleteTemplateItemV2 = async (itemId: string): Promise<void> => {
  await API.delete(`/template/task/${itemId}`);
};
