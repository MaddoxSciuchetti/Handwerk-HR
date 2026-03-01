import { TAuth_User } from '../hooks/use-getHistoryData';

export type THistoryData = {
  id: number;
  timestamp: Date | null;
  status: string | null;
  edit: string | null;
  form_input_id: number;
  changed_by: string | null;
  auth_user: TAuth_User | null;
};
