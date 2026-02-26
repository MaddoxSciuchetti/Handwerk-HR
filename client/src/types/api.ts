import { UseMutationResult } from '@tanstack/react-query';
import { User } from 'shared_prisma_types';

export type APIResponse = SuccessResponse | ErrorResponse;

export type SuccessResponse = {
  success: true;
  affectedRows: number;
};

export type ErrorResponse = {
  success: false;
  error: string;
};

export type TDescriptionData = {
  form_field_id: number;
  description: string | null;
  owner: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
};

export type TDescriptionResponse = TDescriptionData & {
  auth_user: {
    id: number;
    vorname: string;
    nachname: string;
  };
};

export type AbsenceData = {
  id: string;
  absence?: string;
  absencetype: string;
  absencebegin: string;
  absenceEnd: string;
  substitute: string;
};

export type FileResponse = {
  employee_form_id: number;
  original_filename: string;
  file_size: number;
  content_type: string;
  cloud_url: string;
  cloud_key: string;
};

export type Session_API = {
  id: string;
  userAgent: string;
  createdAt: string;
  isCurrent: boolean;
};

export type newField = {
  timestamp: Date | null;
  form_field_id: number;
  description: string | null;
  order_index: number | null;
  owner: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING' | null;
};

export type TMutationRequest = {
  form_field_id?: number;
  description: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  owner: string;
};

export type TCreateMutationResponse = {
  timestamp: Date | null;
  form_field_id: number;
  description: string | null;
  order_index: number | null;
  owner: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING' | null;
};

export type TCreateTaskMutation = UseMutationResult<
  TCreateMutationResponse,
  Error,
  TMutationRequest,
  unknown
>;

export type TEditMutationResponse = {
  form_field_id: number;
  description: string | null;
  owner: string;
};

export type TEditMutation = UseMutationResult<
  TEditMutationResponse,
  Error,
  TMutationRequest,
  unknown
>;
