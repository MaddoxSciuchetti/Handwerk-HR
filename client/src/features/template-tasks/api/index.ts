import API from '@/config/apiClient';
import {
  newField,
  TDescriptionData,
  TDescriptionResponse,
} from '@/types/api.types';

export const deleteDescriptionData = async (id: number) => {
  const response = await API.delete(`/user/deleteDescriptionData/${id}`);
  return response;
};

export const addExtraField = async (data: {
  description: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  owner: string;
}): Promise<newField> => {
  const response = await API.post<newField, newField>(
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
