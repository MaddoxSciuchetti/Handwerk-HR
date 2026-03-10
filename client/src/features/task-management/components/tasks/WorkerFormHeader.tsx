import { Edit } from 'lucide-react';
type WorkerFormHeaderProps = {
  description: string;
  onEdit: () => void;
};

const WorkerFormHeader = ({ description, onEdit }: WorkerFormHeaderProps) => {
  return (
    <>
      <div className="flex flex-row mt-2">
        <p className="w-full underline">{description}</p>
        <Edit className="cursor-pointer" onClick={onEdit} />
      </div>
    </>
  );
};

export default WorkerFormHeader;
