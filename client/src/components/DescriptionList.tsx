import { TDescriptionResponse } from '@/types/api';
import { UseMutateFunction } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { Button } from './ui/button';
import { Dispatch, SetStateAction } from 'react';

type DescriptionListProps = {
  items: TDescriptionResponse[];
  handleSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  deleteDescription: (val: any) => void;
  openEditModal: (
    description?: string | null,
    owner?: string,
    form_field_id?: number
  ) => Promise<void>;
};

const DescriptionList = ({
  items,
  handleSubmit,
  deleteDescription,
  openEditModal,
}: DescriptionListProps) => {
  if (items.length === 0) {
    return (
      <Button
        variant={'outline'}
        onClick={() => {
          openEditModal();
        }}
      >
        Aufgabe Hinzufügen
      </Button>
    );
  }

  return items?.map((item, index) => (
    <div className="hover:scale-100 " key={index}>
      <div className="justify-center items-center hover:scale-100 mt-10">
        <form
          className="flex flex-col"
          onSubmit={handleSubmit}
          name="valuesform"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-row mt-2">
              <img
                onClick={() => deleteDescription(item.form_field_id)}
                src="/assets/x_delete.svg"
                alt="deleticon"
                className="items-center cursor-pointer"
              />
              <div className="ml-5">
                <p className="w-sm underline">{item.description}</p>
              </div>
              <div className="w-full">
                <span className="rounded-2xl bg-gray-100 px-3 py-1 text-sm cursor-pointer group">
                  {item.auth_user.vorname} {item.auth_user.nachname}
                </span>
              </div>

              <img
                className="cursor-pointer"
                src="/assets/editReact.svg"
                onClick={() =>
                  openEditModal(
                    item.description,
                    item.owner,
                    item.form_field_id
                  )
                }
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  ));
};

export default DescriptionList;
