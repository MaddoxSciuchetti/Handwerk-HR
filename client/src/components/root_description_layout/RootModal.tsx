import { TDescriptionData } from "@/lib/api";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { useBodyScrollLock } from "@/hooks/use-no-scroll";

type RootModalProps = {
    data: TDescriptionData[] | undefined;
    form_field_id: number;
    description: string | null;
    owner: string;
    template_type?: "ONBOARDING" | "OFFBOARDING";
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    handleAddSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

function RootModal({
    data,
    form_field_id,
    description,
    owner,
    template_type,
    handleSubmit,
    handleAddSubmit,
}: RootModalProps) {
    const { lockScroll, unlockScroll } = useBodyScrollLock();
    const [tab, setTab] = useState<"EDIT" | "ADD">("EDIT");

    const [selectedValue, setSelectedValue] = useState(owner || "");
    const [selectedType, setSelectedType] = useState<
        "ONBOARDING" | "OFFBOARDING"
    >(template_type || "ONBOARDING");

    const memoizedData = useMemo(() => {
        if (!data) return [];
        const map = new Map<string, TDescriptionData>();
        data.forEach((item) => {
            if (!map.has(item.owner)) {
                map.set(item.owner, item);
            }
        });

        return Array.from(map.values());
    }, [data]);

    useEffect(() => {
        lockScroll();

        return () => {
            unlockScroll();
        };
    }, [lockScroll, unlockScroll]);

    return (
        <>
            <div className="flex flex-col max-h-100 min-h-120 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-2xl">
                <div className="max-w-xl h-full w-xl my-10">
                    {tab === "EDIT" ? (
                        <p className="text-left underline">
                            Beschreibung bearbeiten
                        </p>
                    ) : (
                        <p className="text-left underline">
                            Neue Beschreibung hinzufügen
                        </p>
                    )}
                    <Button
                        variant={tab === "EDIT" ? "default" : "outline"}
                        className={
                            tab === "EDIT"
                                ? "bg-gray-500 text-white"
                                : "bg-gray-200"
                        }
                        onClick={() => setTab("EDIT")}
                    >
                        Edit
                    </Button>
                    <Button
                        variant={tab === "ADD" ? "default" : "outline"}
                        className={
                            tab === "ADD"
                                ? "bg-gray-500 text-white"
                                : "bg-gray-200"
                        }
                        onClick={() => setTab("ADD")}
                    >
                        Hinzufügen
                    </Button>
                    <form
                        onSubmit={
                            tab === "EDIT" ? handleSubmit : handleAddSubmit
                        }
                        name="valuesform"
                    >
                        <input
                            type="hidden"
                            id="form_field_id"
                            name="form_field_id"
                            value={form_field_id}
                        />
                        <input
                            type="hidden"
                            name="owner"
                            value={selectedValue}
                        />

                        {template_type === "ONBOARDING" && tab === "ADD" ? (
                            <input
                                type="hidden"
                                name="template_type"
                                value={"ONBOARDING"}
                            />
                        ) : (
                            <input
                                type="hidden"
                                name="template_type"
                                value={"OFFBOARDING"}
                            />
                        )}

                        <Textarea
                            defaultValue={description || ""}
                            id="description"
                            name="description"
                            className="w-xl"
                        />
                        <Select
                            value={selectedValue}
                            onValueChange={setSelectedValue}
                        >
                            <SelectTrigger
                                id="owner"
                                name="owner"
                                value={owner}

                                // className="w-[17.75rem]"
                            >
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="border-none">
                                <SelectGroup className="bg-white cursor-pointer">
                                    {memoizedData.map((item, index) => (
                                        <SelectItem
                                            className="hover:bg-gray-200 cursor-pointer"
                                            id={`select-${item.form_field_id}`}
                                            value={item.owner}
                                            key={item.form_field_id}
                                        >
                                            {item.owner}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        {selectedType === "ONBOARDING" && tab === "EDIT" ? (
                            <Button type="submit" variant={"outline"}>
                                Änderungen Speichern
                            </Button>
                        ) : (
                            <Button type="submit" variant={"outline"}>
                                Neue Beschreibung hinzufügen
                            </Button>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}
export default RootModal;
