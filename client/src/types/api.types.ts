export type APIResponse = SuccessResponse | ErrorResponse;

export type SuccessResponse = {
  success: true;
  affectedRows: number;
};

export type ErrorResponse = {
  success: false;
  error: string;
};

export type DescriptionData = {
  form_field_id: number;
  description: string | null;
  owner: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
};
export type DescriptionResponse = DescriptionData & {
  auth_user: {
    id: number;
    vorname: string;
    nachname: string;
  };
};

export type EditDescriptionForm = {
  form_field_id: string;
  editcomment: string;
  select_option: string;
  id: string;
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

export type NewDescriptionField = {
  timestamp: Date | null;
  form_field_id: number;
  description: string | null;
  order_index: number | null;
  owner: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING' | null;
};

export type DescriptionField = {
  id: number;
  form_field_id: number;
  description: string;
  officialOwner: string;
  substituteOwner: string;
  owner_id: string;
  is_substitute: boolean;
  status: string;
  edit: string;
};

export type DescriptionFieldResponse = {
  user: {
    id: number;
    vorname: string;
    nachname: string;
  };
  form: {
    id: number;
    type: string;
    fields: DescriptionField[];
  };
};

// export type TMutationRequest = {
//   form_field_id?: number;
//   description: string;
//   template_type: 'ONBOARDING' | 'OFFBOARDING';
//   owner: string;
// };

// export type TCreateMutationResponse = {
//   timestamp: Date | null;
//   form_field_id: number;
//   description: string | null;
//   order_index: number | null;
//   owner: string;
//   template_type: 'ONBOARDING' | 'OFFBOARDING' | null;
// };

// export type TCreateTaskMutation = UseMutationResult<
//   TCreateMutationResponse,
//   Error,
//   TMutationRequest,
//   unknown
// >;

// export type TEditMutationResponse = {
//   form_field_id: number;
//   description: string | null;
//   owner: string;
// };

// export type TEditMutation = UseMutationResult<
//   TEditMutationResponse,
//   Error,
//   TMutationRequest,
//   unknown
// >;
