import { Button } from '@/components/ui/button';
import { DescriptionResponse } from '@/types/api.types';
import { Edit, TrashIcon } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import useDeleteDescription from '../hooks/useDeleteDescription';

type TasksProps = {
  items: DescriptionResponse[];
  openDescriptionModal: (
    description?: string | null,
    owner?: string,
    form_field_id?: number
  ) => Promise<void>;

  mode: 'EDIT' | 'ADD' | undefined;
  setMode: Dispatch<SetStateAction<'EDIT' | 'ADD' | undefined>>;
};

const Tasks = ({ items, openDescriptionModal, setMode }: TasksProps) => {
  const { deleteDescription } = useDeleteDescription();
  return items?.map((item, index) => (
    <div className="rounded-lg border border-border bg-card">
      <ul className="divide-y divide-border">
        <li
          key={index}
          className="group flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium ">{item.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {item.auth_user.vorname} {item.auth_user.nachname}
            </span>

            <div className="flex items-center gap-1 opactiy-0 transition-opacity group-hover:opacity-100">
              <Button
                onClick={() => {
                  openDescriptionModal(
                    item.description,
                    item.owner,
                    item.form_field_id
                  );
                  setMode('EDIT');
                }}
              >
                <Edit className="cursor-pointer" />
              </Button>

              <Button onClick={() => deleteDescription(item.form_field_id)}>
                <TrashIcon className="text-red-600 w-5 h-5 cursor-pointer" />
              </Button>
            </div>
          </div>
        </li>

        {/* <div className=" flex flex-row  w-full items-center mt-5" key={index}>
          <div className="flex items-center gap-5">
            <p className="underline w-20">{item.description}</p>
          </div>
          <div className="grow" />
          <div className="flex gap-5 w-70 ">
            <span className="w-40 cursor-pointer rounded-2xl bg-muted py-1 text-center text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground group">
              {item.auth_user.vorname} {item.auth_user.nachname}
            </span>
            <div className="grow" />
          </div>
        </div> */}
      </ul>
    </div>
  ));
};

export default Tasks;
