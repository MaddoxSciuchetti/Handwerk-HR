import { LifecycleType } from '@/features/task-management/types/index.types';
import { ChevronUpIcon, LucideIcon } from 'lucide-react';
import { ReactNode, useState } from 'react';
import '../../../../../globals.css';
import { Button } from '../button';
import { SelectDropdown } from '../selectdropdown';

function ProjectTable({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex mt-5 w-full h-full flex-col flex-start border border-interactive-disabled-text bg-surface-page rounded-lg">
      {children}
    </div>
  );
}

type TableHeaderProps = {
  label: string;
  action?: () => void;
  actionLabel: string;
};

function TableHeader({ label, action, actionLabel }: TableHeaderProps) {
  const [value, setValue] = useState<string>('number1');
  console.log(value);
  return (
    <div className="px-2 flex w-full items-center gap-10 border-b border-interactive-disabled-text bg-transparent">
      <div className="flex grow py-5 gap-10">
        <p>{label}</p>
      </div>
      <div className="flex gap-2 ">
        <SelectDropdown
          size="lg"
          state="Default"
          icon={ChevronUpIcon}
          label="Select Option"
          options={[
            { label: 'Archive', value: 'number1' },
            { label: 'Option 2', value: 'number2' },
          ]}
          setValue={setValue}
          value={value}
        />
        <Button
          className="text-label-sm"
          variant="default"
          onClick={() => action?.()}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

function Cell({ children }: { children: ReactNode }) {
  return <div className="text-label-lg w-42.5">{children}</div>;
}

type LabelHeaderCellsProps = {
  label: string;
};

const tableHeaderCells: LabelHeaderCellsProps[] = [
  { label: 'Priority' },
  { label: 'Lead' },
  { label: 'Status' },
  { label: 'Zuletzt bearbeitet' },
];

function ProjectHeader() {
  return (
    <div className="flex ">
      <div className="flex grow items-center  ">
        <p className="pl-10 text-body-base">Name</p>
      </div>
      <div className="flex py-3 ">
        {tableHeaderCells.map((cell) => (
          <Cell key={cell.label}>{cell.label}</Cell>
        ))}
      </div>
    </div>
  );
}

type ProjectItemsProps<T extends string> = {
  project_name: string;
  statusInformation: StatusInformation<T>;
  icons?: LucideIcon[];
  img?: string[];
  gotopage: (
    taskId: number,
    form_type: LifecycleType,
    workerName: string
  ) => void;
  form_type: LifecycleType;
  item_value: number;
};

type StatusInformation<T extends string> = {
  status: T;
  priority: 'Low' | 'Mid' | 'High';
  lead: string;
  date: string;
};

function ProjectItem<T extends string>({
  project_name,
  statusInformation,
  img,
  gotopage,
  item_value,
  form_type,
}: ProjectItemsProps<T>) {
  const [Img1, Img2] = img || [];
  return (
    <div
      className="flex items-center relative group py-4 rounded-2xl hover:bg-neutral-50"
      onClick={() => gotopage(item_value, form_type, project_name)}
    >
      {Img2 && (
        <img
          src={Img2}
          className="  absolute ml-2 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full"
        />
      )}
      <div className="flex grow pl-9 items-center">
        {Img1 && <img src={Img1} className="w-5 h-5 rounded-full" />}
        <p className="pl-2 text-label-base ">{project_name}</p>
      </div>
      <div className="flex">
        <Cell>{statusInformation.status}</Cell>
        <Cell>{statusInformation.priority}</Cell>
        <Cell>{statusInformation.lead}</Cell>
        <Cell>{statusInformation.date}</Cell>
      </div>
    </div>
  );
}

export { ProjectHeader, ProjectItem, ProjectTable, TableHeader };
