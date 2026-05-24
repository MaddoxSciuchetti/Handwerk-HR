import API from '@/config/apiClient';

import {
  TemplateTaskFormValues,
  TemplateTaskResponse,
} from '@/features/worker-task-management/types/index.types';
import { SuccessResponse } from '@/types/api.types';
import { TemplateSubmission } from '../hooks/useSubmitTemplate';
import type { IssueTemplateListItem } from '../types/template.types';

export type DeleteTaskResponse = {
  description: string | null;
  order_index: number | null;
  timestamp: Date | null;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  form_field_id: number;
  owner: string;
};

export const deleteTemplate = async (
  id: string
): Promise<SuccessResponse<string>> => {
  const response = await API.delete<
    SuccessResponse<string>,
    SuccessResponse<string>
  >(`/template/${id}`);
  return response;
};

export const createTemplateTask = async (
  data: TemplateTaskFormValues,
  templateId: string
): Promise<TemplateTaskResponse[]> => {
  const response = await API.post<
    TemplateTaskFormValues,
    TemplateTaskResponse[]
  >(`/template/${templateId}/task`, data);
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

export const getTemplateTask = async (
  templateId: string
): Promise<TemplateTaskResponse[]> => {
  const response = await API.get<
    TemplateTaskResponse[],
    TemplateTaskResponse[]
  >(`/template/${templateId}/tasks`);
  return response;
};

export const deleteTemplateTask = async (
  id: string
): Promise<SuccessResponse<string>> => {
  const response = await API.delete<
    SuccessResponse<string>,
    SuccessResponse<string>
  >(`/template/task/${id}`);
  return response;
};

export type UpdateTemplateParams = {
  data: TemplateSubmission;
  templateId: string;
};

export const updateTemplate = async ({
  data,
  templateId,
}: UpdateTemplateParams) => {
  const response = await API.put<UpdateTemplateParams, TemplateSubmission>(
    `/template/${templateId}`,
    data
  );
  return response;
};

export const updateTemplateTask = async (
  data: TemplateTaskFormValues,
  taskId: string
) => {
  const response = await API.put<
    TemplateTaskFormValues,
    TemplateTaskFormValues
  >(`/template/task/${taskId}`, data);
  return response;
};
