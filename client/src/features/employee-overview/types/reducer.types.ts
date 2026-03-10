export type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; employeeId: string; fullname: string }
  | { kind: 'employeecreate' };

export type ModalAction =
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT'; employeeId: string; fullname: string }
  | { type: 'CLOSE' }
  | { type: 'EMPLOYEE_CREATE' };
