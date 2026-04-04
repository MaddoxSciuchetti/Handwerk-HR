export type ModalState =
  | { kind: 'closed' }
  | { kind: 'edit'; employeeId: string; fullname: string }
  | { kind: 'info'; employeeId: string }
  | { kind: 'view'; selectedOwner: string };

export type ModalAction =
  | { type: 'OPEN_EDIT'; employeeId: string; fullname: string }
  | { type: 'OPEN_INFO'; employeeId: string }
  | { type: 'OPEN_VIEW'; selectedOwner: string }
  | { type: 'CLOSE' };
