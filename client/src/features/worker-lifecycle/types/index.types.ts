import { IssueResponse } from '@/features/all-tasks/types/index.types';
import type { EngagementProgressValue } from '../consts/engagement-progress.consts';

export type WorkerListMode = 'active' | 'archived';

export type WorkerStatus = 'active' | 'inactive';

export type EngagementType = 'onboarding' | 'offboarding' | 'transfer';

export type WorkerTypeFilterValue = EngagementType | 'archived';

export type WorkerEngagement = {
  templateApplication?: {
    id: string;
    completedAt: string | null;
    resultsDismissedAt?: string | null;
  } | null;
  id: string;
  type: EngagementType;
  status: EngagementProgressValue;
  startedAt: string;
  completedAt: string | null;
  startDate: string | null;
  endDate: string | null;
  responsibleUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  issues?: Pick<IssueResponse, 'id' | 'status'>[];
  issueCounts?: { status: string; count: number }[];
  taskPhaseCompleted?: boolean;
  questionnaireSubmission?: {
    id: string;
    status: string;
    completedAt?: string | null;
    name?: string;
  } | null;
};

export type WorkerRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  position: string | null;
  status: WorkerStatus;
  birthday?: string | null;
  entryDate?: string | null;
  exitDate?: string | null;
  createdAt: string;
  updatedAt: string;
  engagements: WorkerEngagement[];
};

export type WorkerDetailResponse = {
  success: boolean;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    workEmail: string | null;
    microsoftEmail?: string | null;
    birthday: string | null;
    position: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    entryDate: string | null;
    exitDate: string | null;
    workwear?: Array<{
      itemName: string;
      size: string;
    }>;
    engagements: Array<
      Omit<WorkerEngagement, 'issues'> & {
        issues?: IssueResponse[];
        employmentContract: {
          id: string;
          status: 'draft' | 'ready' | 'signed';
          master: { name: string };
        } | null;
        arbeitszeugnis: {
          id: string;
          sentAt: string | null;
          name: string;
          text: string;
        } | null;
      }
    >;
  };
};

export type EngagementStatus = 'active' | 'archived';
