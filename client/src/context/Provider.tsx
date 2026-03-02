import { ReactNode, useReducer } from 'react';
import { modalReducer } from '../features/employee-overview/reducers/employee-modal-reducer';
import { ModalState } from '../features/employee-overview/types/reducer.types';
import { EmployeeModalContext } from './Context';

export type EmployeeModalContextType = {
  modalState: ModalState;
  openCreate: () => void;
  openEdit: (employeeId: string, fullname: string) => void;
  closeModal: () => void;
};

export function EmployeeModalProvider({ children }: { children: ReactNode }) {
  const [modalState, dispatch] = useReducer(modalReducer, { kind: 'closed' });

  const openCreate = () => {
    dispatch({ type: 'OPEN_CREATE' });
  };

  const openEdit = (employeeId: string, fullname: string) => {
    dispatch({ type: 'OPEN_EDIT', employeeId, fullname });
  };
  const closeModal = () => {
    dispatch({ type: 'CLOSE' });
  };

  return (
    <EmployeeModalContext.Provider
      value={{ modalState, openCreate, openEdit, closeModal }}
    >
      {children}
    </EmployeeModalContext.Provider>
  );
}
