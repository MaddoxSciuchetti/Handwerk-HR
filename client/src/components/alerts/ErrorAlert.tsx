type IsErrorProps = {
  title?: string;
  suggestion?: string;
  message?: string;
};

const ErrorAlert = ({
  title = 'Error loading user',
  suggestion = 'Reload the page',
  message,
}: IsErrorProps) => {
  return (
    <>
      <div className="flex flex-col items-center mt-16 space-y-2">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-destructive">{suggestion}</p>
        <p>{message}</p>
      </div>
    </>
  );
};

export default ErrorAlert;
