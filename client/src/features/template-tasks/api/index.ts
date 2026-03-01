import API from '@/config/apiClient';
import {
  TDescriptionData,
  TDescriptionResponse,
  TNewFormField,
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
}): Promise<TNewFormField> => {
  const response = await API.post<TNewFormField, TNewFormField>(
    `/offboarding/addFormField`,
    data
  );
  return response;
};

export const fetchTaskData = async (): Promise<TDescriptionResponse[]> => {
  const response = await API.get<TDescriptionData[], TDescriptionResponse[]>(
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
