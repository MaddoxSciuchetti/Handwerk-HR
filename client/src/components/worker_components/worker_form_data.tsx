import 'react';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../ui/accordion';

import { useEffect, useState } from 'react';
import { Response, useGetHistory } from '@/hooks/use-getHistoryData';
import { Spinner } from '../ui/spinner';
import { useQuery } from '@tanstack/react-query';
import { getProfileFoto } from '@/features/user-profile/api';

interface FormProps {
  id_original: number;
  description: string;
  officialOwner: string;
  substituteOwner: string;
  editcomment: string;
  select_option: string;
  form_field_id: number;
  handleSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  onEdit: (
    id: number,
    description: string,
    editcomment: string,
    select_option: string,
    form_field_id: number
  ) => void;
  owner_id: number;
  is_substitute: boolean;
}

const Form: React.FC<FormProps> = ({
  id_original,
  description,
  officialOwner,
  substituteOwner,
  editcomment,
  select_option,
  form_field_id,
  handleSubmit,
  onEdit,
  owner_id,
  is_substitute,
  // historyResult,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(
    select_option || ''
  );
  const [editcommentValue, setEditComment] = useState<string>(
    editcomment || ''
  );

  const { data, isPending } = useQuery<string>({
    queryKey: ['profilepic'],
    queryFn: getProfileFoto,
  });

  const { historyData, isLoading, error, refetchHistory } =
    useGetHistory(id_original);

  useEffect(() => {
    setSelectedValue(select_option || '');
    setEditComment(editcomment || '');
  }, [select_option, editcomment]);

  console.log(historyData?.map((val) => console.log(val)));

  return (
    <>
      <div className="justify-center items-center hover:scale-101 mt-10">
        <form
          className="flex flex-col  "
          onSubmit={handleSubmit}
          name="valuesform"
        >
          <input type="hidden" id="id" name="id" value={id_original} />
          <input type="hidden" name="select_option" value={selectedValue} />
          <input
            type="hidden"
            id="form_field_id"
            name="form_field_id"
            value={form_field_id}
          />

          <div className="flex flex-col gap-5">
            <div className="flex flex-row mt-2">
              <p className="w-full underline">{description}</p>
              <img
                className="cursor-pointer"
                src="/assets/editReact.svg"
                alt="text"
                onClick={() =>
                  onEdit(
                    id_original,
                    description,
                    editcomment,
                    select_option,
                    form_field_id
                  )
                }
              />
            </div>
            <div className="flex gap-2 ">
              {is_substitute ? (
                <div className="flex flex-row gap-1">
                  <div className="relative">
                    <span className="rounded-2xl bg-orange-200 px-3 py-1 text-sm cursor-pointer group">
                      {substituteOwner}
                      <div className="absolute bottom-full left-0 mb-2 p-3 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 ">
                        Ersatz
                      </div>
                    </span>
                  </div>

                  <div className="relative">
                    <span className="rounded-2xl bg-gray-100 px-3 py-1 text-sm cursor-pointer group">
                      {officialOwner}
                      <div className="absolute bottom-full left-0 mb-2 p-3 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 ">
                        Verantwortlich
                      </div>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <span className="rounded-2xl bg-gray-100 px-3 py-1 text-sm cursor-pointer group">
                    {officialOwner}
                    <div className="absolute bottom-full left-0 mb-2 p-3 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 ">
                      Verantwortlich
                    </div>
                  </span>
                </div>
              )}

              <div>
                <span
                  className={
                    selectedValue === 'erledigt'
                      ? 'rounded-2xl bg-green-200 px-3 py-1 text-sm'
                      : selectedValue === 'offen'
                        ? 'rounded-2xl bg-red-200 px-3 py-1 text-sm'
                        : selectedValue === 'in_bearbeitung'
                          ? 'rounded-2xl bg-yellow-200 px-3 py-1 text-sm'
                          : ' rounded-2xl bg-red-200 px-3 py-1 text-sm'
                  }
                >
                  {selectedValue === 'erledigt' ? (
                    <span>Erledigt</span>
                  ) : selectedValue === 'in_bearbeitung' ? (
                    <span>In Bearbeitung</span>
                  ) : selectedValue === 'offen' ? (
                    <span>Offen</span>
                  ) : (
                    <span>Status</span>
                  )}
                </span>
              </div>

              <div className="relative">
                <span className="rounded-2xl bg-gray-100 px-3 py-1 text-sm cursor-pointer group">
                  Letzter Kommentar
                  <div className="absolute bottom-full left-0 mb-2 p-3 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 ">
                    {editcommentValue === '' ? (
                      <span>Kein Kommentar</span>
                    ) : (
                      editcommentValue
                    )}
                  </div>
                </span>
              </div>
            </div>

            <Accordion type="single" collapsible className="max-w-6xl">
              <AccordionItem value="shipping" className="mb-10 ">
                <AccordionTrigger className=" -blue-600 border-2 p-2 border-gray-300">
                  Bearbeitungsverlauf
                </AccordionTrigger>
                <AccordionContent className="">
                  {historyData?.length === 0 ? (
                    <p className="mt-5">
                      Es wurden noch keine Änderungen vorgenommen
                    </p>
                  ) : (
                    (historyData || []).map((item: Response, index: number) => (
                      <div key={index} className="">
                        <div className=" mb-2 mt-1">
                          <p className="text-left">
                            <strong>
                              {new Date(item.timestamp).toLocaleDateString()}
                            </strong>
                          </p>
                        </div>
                        <div className="flex">
                          <p>Nutzer: {item.auth_user.email}</p>
                          <img className="ml-1 w-5 h-5 " src={data} />
                        </div>
                        <p>
                          Status:{' '}
                          {selectedValue === 'erledigt' ? (
                            <span>Erledigt</span>
                          ) : selectedValue === 'in_bearbeitung' ? (
                            <span>In Bearbeitung</span>
                          ) : selectedValue === 'offen' ? (
                            <span>Offen</span>
                          ) : (
                            <span>Kein Status</span>
                          )}
                        </p>

                        <p>Kommentar: {item.edit}</p>
                      </div>
                    ))
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </form>
      </div>
    </>
  );
};

export default Form;
