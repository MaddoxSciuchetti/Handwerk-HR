type WorkerInfoHeaderProps = {
  isError: boolean;
};

const WorkerInfoHeader = ({ isError }: WorkerInfoHeaderProps) => {
  return (
    <>
      <h2 className="text-sm font-semibold text-foreground mb-6 tracking-tight">
        Handwerker Informationen
      </h2>

      {isError ? (
        <p className="text-xs text-(--destructive)">
          Informationen konnten nicht geladen werden.
        </p>
      ) : null}
    </>
  );
};

export default WorkerInfoHeader;
