export type ModalState =
  | { kind: 'closed' }
  | { kind: 'edit'; employeeId: string; fullname: string }
  | { kind: 'info'; employeeId: string };

export type ModalAction =
  | { type: 'OPEN_EDIT'; employeeId: string; fullname: string }
  | { type: 'OPEN_INFO'; employeeId: string }
  | { type: 'CLOSE' };
