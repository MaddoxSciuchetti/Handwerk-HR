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
      <div className={cn("default-modal-classes", className)} {...props}>
        <div className="">
          <div>
            <input
              className="border-3 border-blue-500 rounded-full "
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
            {selectedOption === "Onboarding" && (
              <WorkerDataForm
                type={selectedOption}
                success={onSuccess.mutate}
              />
            )}
            {selectedOption === "Offboarding" && (
              <WorkerDataForm
                type={selectedOption}
                success={onSuccess.mutate}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
