import { useState } from 'react';
import { WorkerDataForm } from '../worker_components/worker_form_creation';
import { FormInputs } from '@/zod-schemas/zodSchema';
import { UseMutationResult } from '@tanstack/react-query';
import { TOffboardingItemUser } from '@/types/api';
import RadioSelect from '../RadioSelect';
import { FormType } from '@/types/onof_home';
import { cn } from '@/types/utils';

type ModalProps = {
  createEmployeeMutation: UseMutationResult<
    TOffboardingItemUser,
    Error,
    FormInputs,
    unknown
  >;
  className?: string;
};

const Modal = ({ createEmployeeMutation, className }: ModalProps) => {
  const [selectedOption, setSelectedOption] = useState<FormType | null>(null);

  return (
    <div
      className={cn(
        'flex flex-col max-h-100 min-h-120 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-2xl',
        className
      )}
    >
      <div className="max-w-xl h-full w-xl my-10">
        {selectedOption === null ? (
          <RadioSelect
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
          />
        ) : (
          <WorkerDataForm
            setSelectedOption={setSelectedOption}
            type={selectedOption}
            success={createEmployeeMutation.mutate}
          />
        )}
      </div>
    </div>
  );
};

export default Modal;
