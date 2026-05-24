import FormModalEdit from '@/features/employee-overview/components/modals/edit-employee-modal/FormModal.Edit';
import useGetEmployees from '@/features/employee-overview/hooks/useGetEmployees';

type EmployeeAbsenceContentProps = {
  employeeId: string;
  fullname: string;
  onComplete: () => void;
};

const EmployeeAbsenceContent = ({
  employeeId,
  fullname,
  onComplete,
}: EmployeeAbsenceContentProps) => {
  const { EmployeeData } = useGetEmployees();

  return (
    <FormModalEdit
      id={employeeId}
      fullname={fullname}
      EmployeeData={EmployeeData}
      toggleEmployeeModal={onComplete}
    />
  );
};

export default EmployeeAbsenceContent;
