import 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { useGetWorkerHistory } from '@/features/task-management/hooks/use-getWorkerHistory';
import { useQuery } from '@tanstack/react-query';
import { SubmitEvent } from 'react';
import { workerQueries } from '../../query-options/query.options';

interface FormProps {
  id_original: number;
  description: string;
  officialOwner: string;
  substituteOwner: string;
  editcomment: string;
  select_option: string;
  form_field_id: number;
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  onEdit: (
    id: number,
    description: string,
    editcomment: string,
    select_option: string,
    form_field_id: number
  ) => void;
  is_substitute: boolean;
}

function WorkerForm({
  id_original,
  description,
  officialOwner,
  substituteOwner,
  editcomment,
  select_option,
  form_field_id,
  handleSubmit,
  onEdit,
  is_substitute,
}: FormProps) {
  const { historyData } = useGetWorkerHistory(id_original);

  const { data } = useQuery(workerQueries.getFoto());

  return (
    <div className="justify-center items-center hover:scale-101 mt-10">
      <form
        className="flex flex-col  "
        onSubmit={handleSubmit}
        name="valuesform"
      >
        <input type="hidden" id="id" name="id" value={id_original} />
        <input type="hidden" name="select_option" value={select_option} />
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
                  select_option === 'erledigt'
                    ? 'rounded-2xl bg-green-200 px-3 py-1 text-sm'
                    : select_option === 'offen'
                      ? 'rounded-2xl bg-red-200 px-3 py-1 text-sm'
                      : select_option === 'in_bearbeitung'
                        ? 'rounded-2xl bg-yellow-200 px-3 py-1 text-sm'
                        : ' rounded-2xl bg-red-200 px-3 py-1 text-sm'
                }
              >
                {select_option === 'erledigt' ? (
                  <span>Erledigt</span>
                ) : select_option === 'in_bearbeitung' ? (
                  <span>In Bearbeitung</span>
                ) : select_option === 'offen' ? (
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
                  {editcomment === '' ? (
                    <span>Kein Kommentar</span>
                  ) : (
                    editcomment
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
                  (historyData || []).map((item, index) => (
                    <div key={index} className="">
                      <div className=" mb-2 mt-1">
                        <p className="text-left">
                          <strong>
                            {new Date(item.timestamp || 0).toLocaleDateString()}
                          </strong>
                        </p>
                      </div>
                      <div className="flex">
                        <p>Nutzer: {item.auth_user?.email}</p>
                        <img className="ml-1 w-5 h-5 " src={data} />
                      </div>
                      <p>
                        Status:{' '}
                        {select_option === 'erledigt' ? (
                          <span>Erledigt</span>
                        ) : select_option === 'in_bearbeitung' ? (
                          <span>In Bearbeitung</span>
                        ) : select_option === 'offen' ? (
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
  );
}

export default WorkerForm;
