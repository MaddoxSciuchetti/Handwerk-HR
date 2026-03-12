import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { SubmitEvent, useState } from 'react';
import { Button } from '../../../../components/ui/button';
import inputConsts from '../../consts/input.consts';
import { TaskStatus } from '../../utils/selectOptionTernary';
import SelectOwner from './SelectOwner';

type ModelContentProps = {
  id: number;
  description: string;
  editcomment: string;
  select_option: TaskStatus;
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
  const [selectedValue, setSelectedValue] = useState<TaskStatus>(
    select_option || 'offen'
  );
  const InputConfig = inputConsts(id, form_field_id);

  return (
    <form
      className="flex flex-col gap-5 w-full"
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

      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Status
      </label>
      <SelectOwner
        setSelectedValue={setSelectedValue}
        selectedValue={selectedValue}
        select_option={select_option}
      />
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Kommentar
      </label>
      <Textarea
        defaultValue={editcomment}
        id="editcomment"
        name="editcomment"
        className="w-full rounded-xl"
      />
      <div className="flex w-full min-w-0 flex-row gap-2">
        <Button
          className="w-full flex-1 cursor-pointer rounded-xl transition-colors hover:bg-accent hover:text-accent-foreground"
          variant={'outline'}
          type="submit"
        >
          Speichern
        </Button>
      </div>
    </form>
  );
}

export default ModalContent;
