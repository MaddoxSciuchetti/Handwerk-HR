import "./Modal.css";
import { TiDelete } from "react-icons/ti";
import { useState } from "react";
import { WorkerDataForm } from "../worker_components/worker_form_creation";
import { FormInputs } from "@/schemas/zodSchema";
import { UseMutationResult } from "@tanstack/react-query";

interface ModalProps {
  toggleModal?: () => void;
  newStateTask?: (value: string) => void;
  onSuccess: UseMutationResult<any, Error, FormInputs, unknown>;
}

const Modal: React.FC<ModalProps> = ({ toggleModal, onSuccess }) => {
  const [selectedOption, setSelectedOption] = useState<
    "Onboarding" | "Offboarding"
  >("Onboarding");

  return (
    <>
      <div className="modal">
        <div
          onClick={toggleModal}
          className="h-screen inset-0 fixed z-4ß bg-black/60"
        ></div>
        <div className="absolute text-center items-center z-50 bg-gray-200 rounded-xl top-[50%] left-[50%] h-2/3 w-4xl -translate-x-1/2 -translate-y-1/2">
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
            <TiDelete className="x-item" onClick={toggleModal} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
