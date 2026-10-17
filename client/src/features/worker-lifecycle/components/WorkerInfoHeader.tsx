import { SheetTitle } from '@/components/ui/sheet';

type WorkerInfoHeaderProps = {
  isError: boolean;
};

const WorkerInfoHeader = ({ isError }: WorkerInfoHeaderProps) => {
  return (
    <>
      <SheetTitle className="text-sm font-semibold tracking-tight">
        Handwerker Informationen
      </SheetTitle>

      {isError ? (
        <p className="text-xs text-(--destructive)">
          Informationen konnten nicht geladen werden.
        </p>
      ) : null}
    </>
  );
};

export default WorkerInfoHeader;
