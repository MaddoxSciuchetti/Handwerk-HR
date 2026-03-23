import { ModalAction, ModalState } from './types/context.types';

export function modalReducer(
  state: ModalState,
  action: ModalAction
): ModalState {
  switch (action.type) {
    case 'OPEN_CREATE': {
      return {
        kind: 'open-create',
      };
    }
    case 'OPEN_EDIT': {
      return {
        kind: 'open-edit',
        form_field_id: action.form_field_id,
        description: action.description,
        owner: action.owner,
      };
    }
    case 'CLOSE': {
      return { kind: 'closed' };
    }
  }
}
