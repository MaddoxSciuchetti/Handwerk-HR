import { ModalAction, ModalState } from '../types/reducer.types';

export function modalReducer(
  state: ModalState,
  action: ModalAction
): ModalState {
  switch (action.type) {
    case 'OPEN_EDIT':
      return {
        kind: 'edit',
        employeeId: action.employeeId,
        fullname: action.fullname,
      };
    case 'OPEN_INFO':
      return { kind: 'info', employeeId: action.employeeId };
    case 'OPEN_VIEW':
      return { kind: 'view', selectedOwner: action.selectedOwner };
    case 'CLOSE':
      return { kind: 'closed' };
    default:
      return state;
  }
}
