import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useBodyScrollLock } from '@/hooks/use-no-scroll';
import { SubmitEvent, useState } from 'react';
import { Button } from '../../../../components/ui/button';
import inputConsts from '../../consts/input.consts';
import SelectOwner from './SelectOwner';

type ModelContentProps = {
  id: number;
  description: string;
  editcomment: string;
  select_option: string;
  form_field_id: number;
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
};

function ModalContent({
  id,
  description,
  editcomment,
  select_option,
  form_field_id,
  handleSubmit,
}: ModelContentProps) {
  useBodyScrollLock();
  const [selectedValue, setSelectedValue] = useState(select_option || '');
  const InputConfig = inputConsts(id, form_field_id);

  return (
    <>
      <div className="max-h-min mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl w-2xl">
        <div className="flex items-center gap-10 justify-center mb-6 m-10 ">
          <form
            className="flex flex-col gap-5  w-full"
            onSubmit={handleSubmit}
            name="valuesform"
          >
            <Input type="hidden" name="select_option" value={selectedValue} />

            {InputConfig.map((value) => (
              <Input
                key={value.name}
                type={value.type}
                name={value.name}
                value={value.value}
              />
            ))}
            <p className="text-left underline">{description}</p>
            <Textarea
              defaultValue={editcomment}
              id="editcomment"
              name="editcomment"
              className="w-xl rounded-xl"
            />
            <div className="flex flex-row gap-2">
              <SelectOwner
                setSelectedValue={setSelectedValue}
                selectedValue={selectedValue}
                select_option={select_option}
              />
              <Button
                className="w-71 cursor-pointer hover:bg-gray-300 rounded-xl"
                variant={'outline'}
                type="submit"
              >
                Speichern
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ModalContent;
