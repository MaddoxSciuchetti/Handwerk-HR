import {
  Cell,
  CellHolder,
  GrowingItem,
  Items,
} from '@/components/ui/selfmade/table/Table';
import { LifecycleType } from '@/features/task-management/types/index.types';
import { WorkerRecord } from '../types/index.types';
import { getFirstFormType } from '../utils/formtype';

type ProjectItemProps = {
  worker: WorkerRecord;
  gotopage: (
    taskId: string,
    form_type: LifecycleType,
    workerName: string
  ) => void;
};

function ProjectItem({ worker, gotopage }: ProjectItemProps) {
  const form_type = getFirstFormType(worker);
  const fullname = `${worker.firstName} ${worker.lastName}`;

  return (
    <Items
      state="hover"
      className="flex relative items-center"
      onClick={() => gotopage(worker.id, form_type, fullname)}
    >
      <img
        className="opacity-0 group-hover:opacity-100 absolute w-5 h-5 ml-2 group"
        src="assets/BoxSelect.svg"
      />
      <GrowingItem className="pl-10 py-0">
        <p className="typo-body-base">{worker.firstName}</p>
      </GrowingItem>
      <CellHolder>
        <Cell>{worker.engagements[0].type}</Cell>
        <Cell>{worker.engagements[0].responsibleUser.firstName}</Cell>
        <Cell>{worker.engagements[0].engagementStatus.name}</Cell>
        <Cell>{worker.status}</Cell>
      </CellHolder>
    </Items>
  );
}

export default ProjectItem;
