export type HandleAddSubmit = {
  description: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  owner: string;
};
export type HandleEditSubmit = HandleAddSubmit & {
  form_field_id: number;
};

export type EditDescriptionData = {
  form_field_id: number | undefined;
  description: string | null;
  owner: string;
};
