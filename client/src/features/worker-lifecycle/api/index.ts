import API from '@/config/apiClient';
import { WorkerRecord } from '../types/index.types';

type WorkerRecordResponse = {
  success: boolean;
  data: WorkerRecord[];
};

export type CreateWorkerRequest = {
  firstName: string;
  lastName: string;
  email: string;
  birthday?: string;
  position?: string;
  street?: string;
  entryDate?: string;
  exitDate?: string;
  engagementType: 'onboarding' | 'offboarding';
  responsibleUserId: string;
  startDate?: string;
  endDate?: string;
  templateId?: string;
};

type CreateWorkerResponse = {
  success: boolean;
  data: {
    worker: WorkerRecord;
  };
};

export const getWorkerData = async (): Promise<WorkerRecord[]> => {
  const response = await API.get<WorkerRecordResponse, WorkerRecordResponse>(
    `/worker`,
    { params: { includeArchived: true } }
  );
  return response.data;
};

export const archiveWorkerById = async (workerId: string): Promise<void> => {
  await API.patch(`worker/${workerId}/archive`, {});
};

export const unarchiveWorkerById = async (workerId: string): Promise<void> => {
  await API.patch(`worker/${workerId}/unarchive`, {});
};

export const deleteWorkerById = async (workerId: string): Promise<void> => {
  await API.delete(`worker/${workerId}`);
};

export const deleteWorkersByIds = async (
  workerIds: string[]
): Promise<void> => {
  await Promise.all(workerIds.map((id) => deleteWorkerById(id)));
};

export const addWorker = async (
  data: CreateWorkerRequest
): Promise<CreateWorkerResponse> => {
  const response = await API.post<CreateWorkerResponse, CreateWorkerResponse>(
    '/worker',
    data
  );
  return response;
};
