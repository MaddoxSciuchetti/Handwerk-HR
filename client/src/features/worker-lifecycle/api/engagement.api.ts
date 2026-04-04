import API from '@/config/apiClient';

export type UpdateEngagementBody = {
  responsibleUserId?: string;
  statusId?: string;
};

export async function updateWorkerEngagement(
  workerId: string,
  engagementId: string,
  body: UpdateEngagementBody
): Promise<void> {
  await API.put(`worker/${workerId}/engagements/${engagementId}`, body);
}
