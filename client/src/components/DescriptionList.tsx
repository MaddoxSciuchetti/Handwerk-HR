import { TDescriptionResponse } from '@/types/api';
import { Dispatch, SetStateAction } from 'react';

type DescriptionListProps = {
  items: TDescriptionResponse[];
  deleteDescription: (val: number) => void;
  openDescriptionModal: (
    description?: string | null,
    owner?: string,
    form_field_id?: number
  ) => Promise<void>;

  mode: 'EDIT' | 'ADD' | undefined;
  setMode: Dispatch<SetStateAction<'EDIT' | 'ADD' | undefined>>;
};

const DescriptionList = ({
  items,
  deleteDescription,
  openDescriptionModal,
  setMode,
}: DescriptionListProps) => {
  return items?.map((item, index) => (
    <div className="flex flex-row mt-2 " key={index}>
      <img
        onClick={() => deleteDescription(item.form_field_id)}
        src="/assets/x_delete.svg"
        alt="deleticon"
        className="items-center cursor-pointer"
      />
      <p className="w-sm underline">{item.description}</p>
      <span className="rounded-2xl bg-gray-100 px-3 py-1 text-sm cursor-pointer group">
        {item.auth_user.vorname} {item.auth_user.nachname}
      </span>
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
  ));
};

export default DescriptionList;
