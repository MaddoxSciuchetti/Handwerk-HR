import API from '@/config/apiClient';
import {
  DescriptionData,
  DescriptionResponse,
  NewDescriptionField,
  SuccessResponse,
} from '@/types/api.types';
import { TemplateSubmission } from '../hooks/useSubmitTemplate';
import { EditDescriptionData } from '../types/taskForm.types';
import type { IssueTemplateListItem } from '../types/template.types';

export type DeleteTaskResponse = {
  description: string | null;
  order_index: number | null;
  timestamp: Date | null;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  form_field_id: number;
  owner: string;
};

export const deleteTemplateTask = async (
  id: string
): Promise<SuccessResponse<string>> => {
  const response = await API.delete<
    SuccessResponse<string>,
    SuccessResponse<string>
  >(`/template/${id}`);
  return response;
};

export const createTemplateTask = async (data: {
  description: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  owner: string;
}): Promise<NewDescriptionField> => {
  const response = await API.post<NewDescriptionField, NewDescriptionField>(
    `/template`,
    data
  );
  return response;
};

export const createTemplateTaskV2 = async (
  data: TemplateSubmission
): Promise<TemplateSubmission> => {
  const response = await API.post<TemplateSubmission, TemplateSubmission>(
    `/template/`,
    data
  );
  return response;
};

export const getTemplatesV2 = async (): Promise<IssueTemplateListItem[]> => {
  const response = await API.get<
    IssueTemplateListItem[],
    IssueTemplateListItem[]
  >('/template');
  return response;
};

export const getTemplateTask = async (): Promise<DescriptionResponse[]> => {
  const response = await API.get<DescriptionData[], DescriptionResponse[]>(
    '/template/getTask'
  );
  return response;
};

export const updateTemplateTask = async (data: EditDescriptionData) => {
  const response = await API.put<EditDescriptionData, EditDescriptionData>(
    `/template/updateTask/${data.form_field_id}`,
    data
  );
  return response;
};
