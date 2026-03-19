import { ReactNode, useReducer } from 'react';
import { modalReducer } from './reducer';
import { TemplateModalContext } from './TaskContext';
import { ModalState } from './types/context.types';
export type TemplateModalContextProps = {
  modalState: ModalState;
  openCreateTask: () => void;
  openEditTask: (
    form_field_id: number,
    description: string,
    owner: string
  ) => void;
  closeTask: () => void;
};

export function TaskContextProvider({ children }: { children: ReactNode }) {
  const [modalState, dispatch] = useReducer(modalReducer, { kind: 'closed' });

  const openCreateTask = () => {
    dispatch({ type: 'OPEN_CREATE' });
  };

  const openEditTask = (
    form_field_id: number,
    description: string,
    owner: string
  ) => {
    dispatch({ type: 'OPEN_EDIT', form_field_id, description, owner });
  };

  const closeTask = () => {
    dispatch({ type: 'CLOSE' });
  };

  return (
    <TemplateModalContext.Provider
      value={{ modalState, openCreateTask, openEditTask, closeTask }}
    >
      {children}
    </TemplateModalContext.Provider>
  );
}
