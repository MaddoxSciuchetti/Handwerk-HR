import { ModalAction, ModalState } from '../types/reducer.types';

export function modalReducer(
  state: ModalState,
  action: ModalAction
): ModalState {
  switch (action.type) {
    case 'OPEN_CREATE':
      return { kind: 'create' };
    case 'OPEN_EDIT':
      return {
        kind: 'edit',
        employeeId: action.employeeId,
        fullname: action.fullname,
      };
    case 'CLOSE':
      return { kind: 'closed' };
  }
}
