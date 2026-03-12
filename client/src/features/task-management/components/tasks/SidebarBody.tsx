import { DescriptionField } from '@/types/api.types';
import { InsertHistoryData } from '../../types/index.types';
import HistoryContent from './task-sidebar/task-history/HistoryContent';
import StatusInformation from './task-sidebar/task-status-information/StatusInformation';

type SidebarBodyProps = {
  selectedTask: DescriptionField;
  handleSubmit: (values: InsertHistoryData) => Promise<void>;
};

const SidebarBody = ({ selectedTask, handleSubmit }: SidebarBodyProps) => {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5">
          <StatusInformation
            key={selectedTask.id}
            id={selectedTask.id}
            editcomment={selectedTask.edit}
            select_option={selectedTask.status}
            form_field_id={selectedTask.form_field_id}
            handleSubmit={handleSubmit}
          />
        </div>
        <div className="px-6 pb-5">
          <HistoryContent id_original={selectedTask.id} />
        </div>
      </div>
    </>
  );
};

export default SidebarBody;
