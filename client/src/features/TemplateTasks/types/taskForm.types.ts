export type HandleAddSubmit = {
  description: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  owner: string;
};
export type HandleEditSubmit = HandleAddSubmit & {
  form_field_id: number;
};
