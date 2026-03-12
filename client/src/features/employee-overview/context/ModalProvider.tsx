import { ReactNode, useReducer } from 'react';
import { modalReducer } from '../reducers/employee-modal-reducer';
import { ModalState } from '../types/reducer.types';
import { EmployeeModalContext } from './modalcontext';

export type EmployeeModalContextType = {
  modalState: ModalState;
  openCreate: () => void;
  openEdit: (employeeId: string, fullname: string) => void;
  closeModal: () => void;
  employeeCreate: (owner: string) => void;
};

export function EmployeeModalProvider({ children }: { children: ReactNode }) {
  const [modalState, dispatch] = useReducer(modalReducer, { kind: 'closed' });

  const openCreate = () => {
    dispatch({ type: 'OPEN_CREATE' });
  };

  const openEdit = (employeeId: string, fullname: string) => {
    dispatch({ type: 'OPEN_EDIT', employeeId, fullname });
  };

  const employeeCreate = (owner: string) => {
    dispatch({ type: 'EMPLOYEE_CREATE', owner });
  };

  const closeModal = () => {
    dispatch({ type: 'CLOSE' });
  };

  return (
    <EmployeeModalContext.Provider
      value={{ modalState, openCreate, openEdit, closeModal, employeeCreate }}
    >
      {children}
    </EmployeeModalContext.Provider>
  );
}
