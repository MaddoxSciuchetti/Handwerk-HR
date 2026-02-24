type IsErrorProps = {
  message?: string;
};

const ErrorAlert = ({ message }: IsErrorProps) => {
  return (
    <>
      <div className="flex flex-col items-center mt-16 space-y-2">
        <h1 className="text-3xl font-bold">Error loading user</h1>
        <p className="text-red-500">Please try again later</p>
        <p>{message}</p>
      </div>
    </>
  );
};

export default ErrorAlert;
