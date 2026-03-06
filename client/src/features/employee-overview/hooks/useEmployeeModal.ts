import { EmployeeModalContext } from '@/context/Context';
import { useContext } from 'react';

export function useEmployeeModal() {
  const context = useContext(EmployeeModalContext);
  if (!context) {
    throw new Error('user employeemodal must be used within the provider');
  }
  return context;
}
