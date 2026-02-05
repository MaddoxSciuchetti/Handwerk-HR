import "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";

import { useEffect, useState } from "react";
import { useGetHistory } from "@/hooks/use-getHistoryData";

interface FormProps {
  id_original: number;
  description: string;
  owner: string;
  editcomment: string;
  select_option: string;
  form_field_id: number;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onEdit: (
    id: number,
    description: string,
    editcomment: string,
    select_option: string,
    form_field_id: number,
  ) => void;
}

const Form: React.FC<FormProps> = ({
  id_original,
  description,
  owner,
  editcomment,
  select_option,
  form_field_id,
  handleSubmit,
  onEdit,
  // historyResult,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(
    select_option || "",
  );
  const [editcommentValue, setEditComment] = useState<string>(
    editcomment || "",
  );

  const { historyData, isLoading, error, refetchHistory } =
    useGetHistory(id_original);

  useEffect(() => {
    setSelectedValue(select_option || "");
    setEditComment(editcomment || "");
  }, [select_option, editcomment]);
  return (
    <>
      <div className="outline justify-center items-center">
        <form
          className="grid outline"
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

          <div className="flex flex-row mt-2">
            <p className="w-full underline">{description}</p>
            <img
              className=""
              src="/public/assets/Edit React Icon.svg"
              alt="text"
              onClick={() =>
                onEdit(
                  id_original,
                  description,
                  editcomment,
                  select_option,
                  form_field_id,
                )
              }
            />
          </div>
          <p>Verantwortlich: {owner}</p>

          <div className="flex flex-row">
            <Select
              value={selectedValue}
              onValueChange={setSelectedValue}
              disabled
            >
              <SelectTrigger
                id="status"
                name="select_option"
                value={select_option}
                className="w-full max-w-48"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup className="bg-amber-50">
                  <SelectItem id="select1" value="offen">
                    Offen
                  </SelectItem>
                  <SelectItem id="select2" value="in_bearbeitung">
                    In Bearbeitung
                  </SelectItem>
                  <SelectItem id="select3" value="erledigt">
                    Erledigt
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <textarea
            className="outline "
            placeholder="schreibe deine Notiz"
            id="edit"
            name="editcomment"
            value={editcommentValue}
            readOnly
          ></textarea>

          <Accordion type="single" collapsible className="max-w-lg">
            <AccordionItem value="shipping">
              <AccordionTrigger>Verlauf</AccordionTrigger>
              <AccordionContent>
                {isLoading ? (
                  <p>Loading History</p>
                ) : (
                  (historyData || []).map((item: any, index: any) => (
                    <div key={index}>
                      <p>Status: {item.status}</p>
                      <p>Comment: {item.edit}</p>
                      <p>Time: {item.timestamp}</p>
                      <p>Nutzer: {item.auth_user.email}</p>
                    </div>
                  ))
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
      </div>
    </>
  );
};

export default Form;
