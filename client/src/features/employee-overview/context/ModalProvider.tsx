import { FormType } from '@/features/worker-lifecycle/types/index.types';
import { ReactNode, useReducer } from 'react';
import { modalReducer } from '../reducers/employee-modal-reducer';
import { ModalState } from '../types/reducer.types';
import { EmployeeModalContext } from './modalcontext';

export type EmployeeModalContextType = {
  modalState: ModalState;
  openCreateEmployee: () => void;
  openEditEmployee: (employeeId: string, fullname: string) => void;
  closeEmployee: () => void;
  openEmployeeReminder: (owner: string) => void;
  openInfoModal: (workerId: number, lifecycleType: FormType) => void;
};

export function EmployeeModalProvider({ children }: { children: ReactNode }) {
  const [modalState, dispatch] = useReducer(modalReducer, { kind: 'closed' });

  const openCreateEmployee = () => {
    dispatch({ type: 'OPEN_CREATE' });
  };

  const openEditEmployee = (employeeId: string, fullname: string) => {
    dispatch({ type: 'OPEN_EDIT', employeeId, fullname });
  };

  const openEmployeeReminder = (owner: string) => {
    dispatch({ type: 'EMPLOYEE_CREATE', owner });
  };

  const closeEmployee = () => {
    dispatch({ type: 'CLOSE' });
  };

  const openInfoModal = (workerId: number, lifecycleType: FormType) => {
    dispatch({ type: 'OPEN_EMPLOYEE_INFO', workerId, lifecycleType });
  };

  return (
    <EmployeeModalContext.Provider
      value={{
        modalState,
        openCreateEmployee,
        openEditEmployee,
        closeEmployee,
        openEmployeeReminder,
        openInfoModal,
      }}
    >
      {children}
    </EmployeeModalContext.Provider>
  );
}
