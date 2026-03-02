import { DescriptionResponse } from '@/types/api.types';
import { Dispatch, SetStateAction } from 'react';

type TasksProps = {
  items: DescriptionResponse[];
  deleteDescription: (val: number) => void;
  openDescriptionModal: (
    description?: string | null,
    owner?: string,
    form_field_id?: number
  ) => Promise<void>;

  mode: 'EDIT' | 'ADD' | undefined;
  setMode: Dispatch<SetStateAction<'EDIT' | 'ADD' | undefined>>;
};

const Tasks = ({
  items,
  deleteDescription,
  openDescriptionModal,
  setMode,
}: TasksProps) => {
  return items?.map((item, index) => (
    <div className="flex flex-row  w-full items-center mt-5" key={index}>
      <div className="flex items-center gap-5">
        <img
          onClick={() => deleteDescription(item.form_field_id)}
          src="/assets/x_delete.svg"
          alt="deleticon"
          className="items-center cursor-pointer"
        />
        <p className="underline w-20">{item.description}</p>
      </div>
      <div className="grow" />
      <div className="flex gap-5 w-70 ">
        <span className="rounded-2xl bg-gray-100 py-1 w-40 text-center text-sm cursor-pointer group">
          {item.auth_user.vorname} {item.auth_user.nachname}
        </span>
        <div className="grow" />
        <img
          className="cursor-pointer"
          src="/assets/editReact.svg"
          onClick={() => {
            openDescriptionModal(
              item.description,
              item.owner,
              item.form_field_id
            );
            setMode('EDIT');
          }}
        />
      </div>
    </div>
  ));
};

export default Tasks;
