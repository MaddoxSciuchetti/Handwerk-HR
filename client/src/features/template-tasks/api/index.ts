import API from '@/config/apiClient';
import {
  DescriptionData,
  DescriptionResponse,
  NewDescriptionField,
} from '@/types/api.types';
import { EditDescriptionData } from '../types/taskForm.types';

export const deleteDescriptionData = async (id: number) => {
  const response = await API.delete(`/user/deleteDescriptionData/${id}`);
  return response;
};

export const addExtraField = async (data: {
  description: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  owner: string;
}): Promise<NewDescriptionField> => {
  const response = await API.post<NewDescriptionField, NewDescriptionField>(
    `/offboarding/addFormField`,
    data
  );
  return response;
};

export const fetchTaskData = async (): Promise<DescriptionResponse[]> => {
  const response = await API.get<DescriptionData[], DescriptionResponse[]>(
    '/user/fetchTaskData'
  );
  return response;
};

export const editTaskData = async (data: EditDescriptionData) => {
  const response = await API.put<EditDescriptionData, EditDescriptionData>(
    `/user/editTaskData/${data.form_field_id}`,
    data
  );
  return response;
};
