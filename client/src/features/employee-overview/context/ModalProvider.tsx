import { ReactNode, useReducer } from 'react';
import { modalReducer } from '../reducers/employee-modal-reducer';
import { ModalState } from '../types/reducer.types';
import { EmployeeModalContext } from './modalcontext';

export type EmployeeModalContextType = {
  modalState: ModalState;
  openEditEmployee: (employeeId: string, fullname: string) => void;
  openEmployeeInfo: (employeeId: string) => void;
  openViewEmployee: (selectedOwner: string) => void;
  closeEmployee: () => void;
};

export function EmployeeModalProvider({ children }: { children: ReactNode }) {
  const [modalState, dispatch] = useReducer(modalReducer, { kind: 'closed' });

  const openEditEmployee = (employeeId: string, fullname: string) => {
    dispatch({ type: 'OPEN_EDIT', employeeId, fullname });
  };

  const openEmployeeInfo = (employeeId: string) => {
    dispatch({ type: 'OPEN_INFO', employeeId });
  };

  const openViewEmployee = (selectedOwner: string) => {
    dispatch({ type: 'OPEN_VIEW', selectedOwner });
  };

  const closeEmployee = () => {
    dispatch({ type: 'CLOSE' });
  };

  return (
    <EmployeeModalContext.Provider
      value={{
        modalState,
        openEditEmployee,
        openEmployeeInfo,
        openViewEmployee,
        closeEmployee,
      }}
    >
      {children}
    </EmployeeModalContext.Provider>
  );
}
