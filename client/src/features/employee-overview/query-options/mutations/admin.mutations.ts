import { mutationOptions } from '@tanstack/react-query';
import { sendReminderWorker } from '../../api/index.api';
import { EMPLOYEE_EMAIL } from '../../consts/query-key.consts';
import { SendReminder } from '../../types/adminModal.types';

export const adminMutations = {
  sendReminder: () => {
    return mutationOptions<unknown, Error, SendReminder>({
      mutationKey: [EMPLOYEE_EMAIL],
      mutationFn: (data: SendReminder) => sendReminderWorker(data),
    });
  },
};
