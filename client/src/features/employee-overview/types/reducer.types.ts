export type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; employeeId: string; fullname: string }
  | { kind: 'employeecreate'; owner: string };

export type ModalAction =
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT'; employeeId: string; fullname: string }
  | { type: 'CLOSE' }
  | { type: 'EMPLOYEE_CREATE'; owner: string };
