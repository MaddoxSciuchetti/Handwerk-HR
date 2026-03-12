import { EmployeeModalContext } from '@/features/employee-overview/context/modalcontext';
import { useContext } from 'react';

export function useEmployeeModal() {
  const context = useContext(EmployeeModalContext);
  if (!context) {
    throw new Error('user employeemodal must be used within the provider');
  }
  return context;
}
