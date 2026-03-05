type WorkerFormHeaderProps = {
  description: string;
  onEdit: () => void;
};

const WorkerFormHeader = ({ description, onEdit }: WorkerFormHeaderProps) => {
  return (
    <>
      <div className="flex flex-row mt-2">
        <p className="w-full underline">{description}</p>
        <img
          className="cursor-pointer"
          src="/assets/editReact.svg"
          alt="text"
          onClick={onEdit}
        />
      </div>
    </>
  );
};

export default WorkerFormHeader;
