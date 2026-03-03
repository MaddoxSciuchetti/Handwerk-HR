import API from '@/config/apiClient';
import {
  DescriptionData,
  DescriptionResponse,
  NewDescriptionField,
} from '@/types/api.types';
import { EditDescriptionData } from '../types/taskForm.types';

export const deleteTemplateTask = async (id: number) => {
  const response = await API.delete(`/template/task/${id}`);
  return response;
};

export const createTemplateTask = async (data: {
  description: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  owner: string;
}): Promise<NewDescriptionField> => {
  const response = await API.post<NewDescriptionField, NewDescriptionField>(
    `/template/createTask`,
    data
  );
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
