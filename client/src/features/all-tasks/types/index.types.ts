import type { IssueStatusValue } from '../consts/issue-status.consts';

export type EngagementResponse = {
  id: string;
  type: string;
  workerId: string;
  workerFirstName: string;
  workerLastName: string;
};

export type ListEngagementsResponse = {
  engagements: EngagementResponse[];
};

export type IssueAssignee = {
  id: string;
  firstName: string;
  lastName: string;
};

export type IssueResponse = {
  id: string;
  workerEngagementId: string;
  createdByUserId: string;
  assigneeUserId: string | null;
  assignee?: IssueAssignee | null;
  templateItemId: string | null;
  status: IssueStatusValue;
  kind: 'standard' | 'contract_send';
  isTemporary: boolean;
  workerEngagement?: { workerId: string };
  title: string;
  description: string | null;
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'no_priority';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskSidebarForm = {
  title: string;
  workerEngagementId: string;
  assigneeUserId: string;
  status: IssueStatusValue;
};
