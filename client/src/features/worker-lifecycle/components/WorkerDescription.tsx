import { WorkerInfoItem } from '../consts/worker-info.consts';

type WorkerDescriptionProps = {
  item: WorkerInfoItem;
};

const WorkerDescription = ({ item }: WorkerDescriptionProps) => {
  return (
    <>
      <span
        key={`${item.label}-label`}
        className={item.className ?? 'text-muted-foreground'}
      >
        {item.label}
      </span>
    </>
  );
};

export default WorkerDescription;
