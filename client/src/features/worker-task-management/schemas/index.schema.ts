import z from 'zod';

export const formSchema = z.object({
  id: z.string(),
  editcomment: z.string(),
  select_option: z.string(),
  form_field_id: z.string(),
});
