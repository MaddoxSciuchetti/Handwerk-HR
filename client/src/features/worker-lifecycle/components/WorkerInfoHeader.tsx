import { Spinner } from '@/components/ui/spinner';

type WorkerInfoHeaderProps = {
  isLoading: boolean;
  isError: boolean;
};

const WorkerInfoHeader = ({ isLoading, isError }: WorkerInfoHeaderProps) => {
  return (
    <>
      <h2 className="text-sm font-semibold text-foreground">
        Handwerker Informationen
      </h2>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">
          <Spinner />{' '}
        </p>
      ) : null}

      {isError ? (
        <p className="text-xs text-(--destructive)">
          Informationen konnten nicht geladen werden.
        </p>
      ) : null}
    </>
  );
};

export default WorkerInfoHeader;
