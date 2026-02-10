import "./Modal.css";
import { TiDelete } from "react-icons/ti";
import { useState } from "react";
import { WorkerDataForm } from "../worker_components/worker_form_creation";
import { FormInputs } from "@/schemas/zodSchema";
import { UseMutationResult } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
    FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ModalProps {
    newStateTask?: (value: string) => void;
    onSuccess: UseMutationResult<any, Error, FormInputs, unknown>;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({ onSuccess, className, ...props }) => {
    const [selectedOption, setSelectedOption] = useState<
        "Onboarding" | "Offboarding" | null
    >(null);

    return (
        <>
            <div className="flex flex-col max-h-100 min-h-120 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-2xl">
                <div className="max-w-xl h-full w-xl my-10">
                    {selectedOption === null ? (
                        <RadioGroup
                            className="h-full flex flex-row items-center"
                            onValueChange={(value) =>
                                setSelectedOption(
                                    value as "Onboarding" | "Offboarding",
                                )
                            }
                            value={selectedOption}
                        >
                            <FieldLabel
                                htmlFor="plus-plan"
                                className={`${selectedOption === "Onboarding" ? " bg-gray-300 scale-105" : ""} cursor-pointer rounded-lg p-3 hover:bg-gray-300 hover:scale-105`}
                            >
                                <Field orientation="horizontal">
                                    <FieldContent className="text-left">
                                        <FieldTitle>Onboarding</FieldTitle>
                                        <FieldDescription>
                                            Onboarde ein Mitarbeiter
                                        </FieldDescription>
                                    </FieldContent>
                                    <RadioGroupItem
                                        value="Onboarding"
                                        id="plus-plan"
                                    />
                                </Field>
                            </FieldLabel>
                            <FieldLabel
                                htmlFor="pro-plan"
                                className={`${selectedOption === "Offboarding" ? "active bg-gray-300 scale-105" : ""} cursor-pointer rounded-lg p-3 hover:bg-gray-300 hover:scale-105`}
                            >
                                <Field orientation="horizontal">
                                    <FieldContent className="text-left">
                                        <FieldTitle>Offboarding</FieldTitle>
                                        <FieldDescription className="">
                                            Offboarde ein Mitarbeiter
                                        </FieldDescription>
                                    </FieldContent>
                                    <RadioGroupItem
                                        value="Offboarding"
                                        id="pro-plan"
                                    />
                                </Field>
                            </FieldLabel>
                        </RadioGroup>
                    ) : selectedOption === "Onboarding" ? (
                        <WorkerDataForm
                            setSelectedOption={setSelectedOption}
                            type={selectedOption}
                            success={onSuccess.mutate}
                        />
                    ) : selectedOption === "Offboarding" ? (
                        <WorkerDataForm
                            setSelectedOption={setSelectedOption}
                            type={selectedOption}
                            success={onSuccess.mutate}
                        />
                    ) : (
                        ""
                    )}
                </div>
            </div>
        </>
    );
};

export default Modal;
