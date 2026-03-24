import { FormType } from '@/features/worker-lifecycle/types/index.types';

export type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; employeeId: string; fullname: string }
  | { kind: 'employeecreate'; owner: string }
  | { kind: 'employeeinfo'; employeeId: string };

export type ModalAction =
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT'; employeeId: string; fullname: string }
  | { type: 'CLOSE' }
  | { type: 'EMPLOYEE_CREATE'; owner: string }
  | { type: 'OPEN_EMPLOYEE_INFO'; employeeId: string };
