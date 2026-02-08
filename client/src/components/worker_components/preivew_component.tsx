import { useBodyScrollLock } from "@/hooks/use-no-scroll";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { Sidebar } from "../ui/sidebar";

type PreviewCompoent = {
  toggleModal: () => void;
  id: number;
  description: string;
  editcomment: string;
  select_option: string;
  form_field_id: number;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

function PreviewComponent({
  toggleModal,
  id,
  description,
  editcomment,
  select_option,
  form_field_id,
  handleSubmit,
}: PreviewCompoent) {
  const { lockScroll, unlockScroll } = useBodyScrollLock();
  const [selectedValue, setSelectedValue] = useState(select_option || "");

  useEffect(() => {
    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [lockScroll, unlockScroll]);

  return (
    <>
      <div className="max-h-min mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl w-2xl">
        <div className="flex items-center gap-10 justify-center mb-6 m-10 ">
          <form
            className="flex flex-col gap-5  w-full"
            onSubmit={handleSubmit}
            name="valuesform"
          >
            <input type="hidden" id="id" name="id" value={id} />
            <input
              type="hidden"
              id="form_field_id"
              name="form_field_id"
              value={form_field_id}
            />
            <p className="text-left underline">{description}</p>
            <Textarea
              defaultValue={editcomment}
              id="editcomment"
              name="editcomment"
              className="w-xl"
            />

            <input type="hidden" name="select_option" value={selectedValue} />

            <div className="flex flex-row gap-2">
              <div>
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger
                    id="status"
                    name="select_option"
                    value={select_option}
                    className={
                      selectedValue === "erledigt"
                        ? " bg-green-600 px-3 py-1 text-sm w-[17.75rem]"
                        : selectedValue === "offen"
                          ? " bg-red-200 px-3 py-1 text-sm w-[17.75rem]"
                          : selectedValue === "in_bearbeitung"
                            ? " bg-orange-500 px-3 py-1 text-sm w-[17.75rem]"
                            : "  bg-red-400 px-3 py-1 text-sm w-[17.75rem]"
                    }
                    // className="w-[17.75rem]"
                  >
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="border-none">
                    <SelectGroup className="bg-white cursor-pointer">
                      <SelectItem
                        className="hover:bg-gray-200 cursor-pointer"
                        id="select1"
                        value="offen"
                      >
                        Offen
                      </SelectItem>
                      <SelectItem
                        className="hover:bg-gray-200 cursor-pointer"
                        id="select2"
                        value="in_bearbeitung"
                      >
                        In Bearbeitung
                      </SelectItem>
                      <SelectItem
                        className="hover:bg-gray-200 cursor-pointer"
                        id="select3"
                        value="erledigt"
                      >
                        Erledigt
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button
                  className="w-[17.75rem] hover:bg-gray-300"
                  variant={"outline"}
                  type="submit"
                >
                  Speichern
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default PreviewComponent;
