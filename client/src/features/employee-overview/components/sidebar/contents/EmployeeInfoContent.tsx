import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { employeeInfos } from '@/features/employee-overview/consts/employee-info.consts';
import useEmployeeInfo from '@/features/employee-overview/hooks/useEmployeeInfo';
import { EmployeeInfoItem } from '@/features/employee-overview/types/index.types';

type EmployeeInfoContentProps = {
  employeeId: string;
};

const EmployeeInfoContent = ({ employeeId }: EmployeeInfoContentProps) => {
  const { employeeInfo, isLoading, isError } = useEmployeeInfo(
    employeeId,
    true
  );
  console.log(employeeInfo);

  if (isError) return <ErrorAlert />;
  if (isLoading || !employeeInfo) {
    return (
      <div className="flex min-h-40 w-full items-center justify-center">
        <LoadingAlert className="min-h-0" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {employeeInfos(employeeInfo).map(
        (item: EmployeeInfoItem, idx: number) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 border-b border-border/50 py-3 last:border-0"
          >
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-sm text-foreground">{item.value || '—'}</span>
          </div>
        )
      )}
    </div>
  );
};

export default EmployeeInfoContent;
