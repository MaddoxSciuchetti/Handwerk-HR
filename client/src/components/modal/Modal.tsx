import "./Modal.css";
import { TiDelete } from "react-icons/ti";
import { useState } from "react";
import { WorkerDataForm } from "../worker_components/worker_form_creation";
import { FormInputs } from "@/schemas/zodSchema";
import { UseMutationResult } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface ModalProps {
  toggleModal?: () => void;
  newStateTask?: (value: string) => void;
  onSuccess: UseMutationResult<any, Error, FormInputs, unknown>;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  toggleModal,
  onSuccess,
  className,
  ...props
}) => {
  const [selectedOption, setSelectedOption] = useState<
    "Onboarding" | "Offboarding"
  >("Onboarding");

  return (
    <>
      <div className="max-h-min mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-2xl">
        <div className="flex items-center gap-10 justify-center mb-6 m-10">
          <div>
            <input
              id="Onboarding"
              type="radio"
              name="radio"
              value="Onboarding"
              checked={selectedOption === "Onboarding"}
              onChange={(e) =>
                setSelectedOption(
                  e.target.value as "Onboarding" | "Offboarding",
                )
              }
            />
            <label htmlFor={"Onboarding"}>Onboarding</label>
          </div>
          <div>
            <input
              id="Offboarding"
              type="radio"
              name="radio"
              value="Offboarding"
              checked={selectedOption === "Offboarding"}
              onChange={(e) =>
                setSelectedOption(
                  e.target.value as "Onboarding" | "Offboarding",
                )
              }
            />
            <label htmlFor="Offboarding">Offboarding</label>
          </div>
        </div>
        <div>
          {selectedOption === "Onboarding" && (
            <WorkerDataForm type={selectedOption} success={onSuccess.mutate} />
          )}
          {selectedOption === "Offboarding" && (
            <WorkerDataForm type={selectedOption} success={onSuccess.mutate} />
          )}
        </div>
      </div>
    </>
  );
};

export default Modal;
