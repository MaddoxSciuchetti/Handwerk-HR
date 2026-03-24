import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import MediumWrapper from '@/components/modal/modalSizes/MediumWrapper';
import { employeeInfos } from '@/features/employee-overview/consts/employee-info.consts';
import useEmployeeInfo from '@/features/employee-overview/hooks/useEmployeeInfo';
import { EmployeeInfoItem } from '@/features/employee-overview/types/index.types';

const EmployeeInfoModal = ({ employeeId }: { employeeId: string }) => {
  const { employeeInfo, isLoading, isError } = useEmployeeInfo(
    employeeId,
    true
  );

  if (isError) return <ErrorAlert />;

  return (
    <MediumWrapper width="w-full max-w-2xl" height="h-auto min-h-80">
      <div className="flex w-full flex-col p-8 text-left">
        <h2 className="mb-6 text-sm font-semibold tracking-tight text-foreground">
          Mitarbeiter Informationen
        </h2>

        {isLoading && (
          <div className="flex min-h-60 w-full items-center justify-center">
            <LoadingAlert className="min-h-0" />
          </div>
        )}
        {employeeInfo && (
          <div className="w-full">
            {employeeInfos(employeeInfo).map(
              (item: EmployeeInfoItem, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 border-b border-border/50 py-3.5 last:border-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="text-sm text-foreground">
                    {item.value || '—'}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </MediumWrapper>
  );
};

export default EmployeeInfoModal;
