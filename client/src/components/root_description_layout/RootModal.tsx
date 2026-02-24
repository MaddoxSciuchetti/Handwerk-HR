import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dispatch,
  SetStateAction,
  SubmitEvent,
  useEffect,
  useState,
} from 'react';
import { Button } from '../ui/button';
import { useBodyScrollLock } from '@/hooks/use-no-scroll';
import { TDescriptionData } from '@/types/api';
import { TEmployeeResponse } from '@/zod-schemas/schema';

type RootModalProps = {
  data: TDescriptionData[] | undefined;
  form_field_id: number | null | undefined;
  description: string | null | undefined;
  owner: string | null | undefined;
  template_type?: 'ONBOARDING' | 'OFFBOARDING';
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  handleAddSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  EmployeeData: TEmployeeResponse | undefined;
  OnboardingData?: TDescriptionData[] | undefined;
  OffboardingData?: TDescriptionData[] | undefined;
};

function RootModal({
  data,
  form_field_id,
  description,
  owner,
  template_type,
  handleSubmit,
  handleAddSubmit,
  EmployeeData,
}: RootModalProps) {
  const { lockScroll, unlockScroll } = useBodyScrollLock();
  const [tab, setTab] = useState<'EDIT' | 'ADD'>('EDIT');

  // needs to be dynamic based on the actual existing employees
  const [selectedValue, setSelectedValue] = useState(owner || '');
  const [selectedType, setSelectedType] = useState<
    'ONBOARDING' | 'OFFBOARDING'
  >(template_type || 'ONBOARDING');

  useEffect(() => {
    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [lockScroll, unlockScroll]);

  return (
    <>
      <div className="flex flex-col max-h-100 min-h-120 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-2xl">
        <div className="flex flex-col max-w-xl h-full w-xl my-10 items-start">
          {data && template_type === 'OFFBOARDING' ? (
            <>
              <form
                onSubmit={handleAddSubmit}
                name="valuesform"
                className="flex flex-col items-start"
              >
                Neue Aufgabe Offboarding
                <input type="hidden" name="owner" value={selectedValue || ''} />
                <input
                  type="hidden"
                  name="template_type"
                  value={'OFFBOARDING'}
                />
                <Textarea
                  defaultValue={description || ''}
                  id="description"
                  name="description"
                  className="w-xl mb-5"
                />
                <div className="flex flex-row gap-2">
                  <Select
                    value={selectedValue}
                    onValueChange={setSelectedValue}
                  >
                    <SelectTrigger
                      id="owner"
                      name="owner"
                      value={selectedValue}
                      className="w-[17.75rem]"

                      // className="w-[17.75rem]"
                    >
                      <SelectValue placeholder="Auswählen" />
                    </SelectTrigger>
                    <SelectContent className="border-none">
                      <SelectGroup className="bg-white cursor-pointer">
                        {EmployeeData?.map((item) => (
                          <SelectItem
                            className="hover:bg-gray-200 cursor-pointer"
                            id={`select-${item.id}`}
                            value={item.id}
                            key={item.id}
                          >
                            {item.vorname} {item.nachname}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {tab === 'EDIT' && tab === 'EDIT' ? (
                    <Button
                      type="submit"
                      variant={'outline'}
                      className="  text-left justify-start cursor-pointer hover:bg-gray-200 w-[17.75rem]"
                    >
                      Speichern
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant={'outline'}
                      className="w-[17.75rem] text-left justify-start cursor-pointer hover:bg-gray-200 "
                    >
                      Neue Beschreibung hinzufügen
                    </Button>
                  )}
                </div>
              </form>
            </>
          ) : data && template_type === 'ONBOARDING' ? (
            <>
              <form
                onSubmit={handleAddSubmit}
                name="valuesform"
                className="flex flex-col items-start"
              >
                Neue Aufgabe Onboarding
                <input type="hidden" name="owner" value={selectedValue || ''} />
                <input
                  type="hidden"
                  name="template_type"
                  value={'ONBOARDING'}
                />
                <Textarea
                  defaultValue={description || ''}
                  id="description"
                  name="description"
                  className="w-xl mb-5"
                />
                <div className="flex flex-row gap-2">
                  <Select
                    value={selectedValue}
                    onValueChange={setSelectedValue}
                  >
                    <SelectTrigger
                      id="owner"
                      name="owner"
                      value={selectedValue}
                      className="w-[17.75rem]"

                      // className="w-[17.75rem]"
                    >
                      <SelectValue placeholder="Auswählen" />
                    </SelectTrigger>
                    <SelectContent className="border-none">
                      <SelectGroup className="bg-white cursor-pointer">
                        {EmployeeData?.map((item) => (
                          <SelectItem
                            className="hover:bg-gray-200 cursor-pointer"
                            id={`select-${item.id}`}
                            value={item.id}
                            key={item.id}
                          >
                            {item.vorname} {item.nachname}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {tab === 'EDIT' && tab === 'EDIT' ? (
                    <Button
                      type="submit"
                      variant={'outline'}
                      className="  text-left justify-start cursor-pointer hover:bg-gray-200 w-[17.75rem]"
                    >
                      Speichern
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant={'outline'}
                      className="w-[17.75rem] text-left justify-start cursor-pointer hover:bg-gray-200 "
                    >
                      Neue Beschreibung hinzufügen
                    </Button>
                  )}
                </div>
              </form>
            </>
          ) : (
            <>
              <Button
                variant={tab === 'EDIT' ? 'default' : 'outline'}
                className={
                  tab === 'EDIT'
                    ? 'bg-gray-500 text-white underline'
                    : 'bg-gray-200'
                }
                onClick={() => setTab('EDIT')}
              >
                Editieren
              </Button>
              <Button
                variant={tab === 'ADD' ? 'default' : 'outline'}
                className={
                  tab === 'ADD'
                    ? 'bg-gray-500 text-white underline'
                    : 'bg-gray-200'
                }
                onClick={() => setTab('ADD')}
              >
                Hinzufügen
              </Button>

              {tab === 'EDIT' ? (
                <p className="text-left underline mt-5 mb-5">
                  Beschreibung bearbeiten
                </p>
              ) : (
                <p className="text-left underline mt-5 mb-5">
                  Neue Beschreibung hinzufügen
                </p>
              )}
              <form
                onSubmit={tab === 'EDIT' ? handleSubmit : handleAddSubmit}
                name="valuesform"
                className="flex flex-col items-start"
              >
                <input
                  type="hidden"
                  id="form_field_id"
                  name="form_field_id"
                  value={form_field_id || ''}
                />
                <input type="hidden" name="owner" value={selectedValue || ''} />
                {template_type === 'ONBOARDING' && tab === 'ADD' ? (
                  <input
                    type="hidden"
                    name="template_type"
                    value={'ONBOARDING'}
                  />
                ) : (
                  <input
                    type="hidden"
                    name="template_type"
                    value={'OFFBOARDING'}
                  />
                )}
                <Textarea
                  defaultValue={description || ''}
                  id="description"
                  name="description"
                  className="w-xl mb-5"
                />

                <div className="flex flex-row gap-2">
                  <Select
                    value={selectedValue}
                    onValueChange={setSelectedValue}
                  >
                    <SelectTrigger
                      id="owner"
                      name="owner"
                      value={selectedValue}
                      className="w-[17.75rem]"

                      // className="w-[17.75rem]"
                    >
                      <SelectValue placeholder="Auswählen" />
                    </SelectTrigger>
                    <SelectContent className="border-none">
                      <SelectGroup className="bg-white cursor-pointer">
                        {EmployeeData?.map((item) => (
                          <SelectItem
                            className="hover:bg-gray-200 cursor-pointer"
                            id={`select-${item.id}`}
                            value={item.id}
                            key={item.id}
                          >
                            {item.vorname} {item.nachname}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {tab === 'EDIT' && tab === 'EDIT' ? (
                    <Button
                      type="submit"
                      variant={'outline'}
                      className="  text-left justify-start cursor-pointer hover:bg-gray-200 w-[17.75rem]"
                    >
                      Speichern
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant={'outline'}
                      className="w-[17.75rem] text-left justify-start cursor-pointer hover:bg-gray-200 "
                    >
                      Neue Beschreibung hinzufügen
                    </Button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
export default RootModal;
