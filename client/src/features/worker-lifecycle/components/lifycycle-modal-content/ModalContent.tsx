import { cn } from '@/types/utils.types';
import { AddWorker } from '@/zod-schemas/zodSchema';
import { UseMutationResult } from '@tanstack/react-query';
import { useState } from 'react';
import { FormType, TOffboardingItemUser } from '../../types/index.types';
import RadioSelect from './RadioSelect';
import { WorkerForm } from './WorkerForm';

type ModalProps = {
  createEmployeeMutation: UseMutationResult<
    TOffboardingItemUser,
    Error,
    AddWorker,
    unknown
  >;
  className?: string;
};

const ModalContent = ({ createEmployeeMutation, className }: ModalProps) => {
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
          <WorkerForm
            setSelectedOption={setSelectedOption}
            type={selectedOption}
            success={createEmployeeMutation.mutate}
          />
        )}
      </div>
    </div>
  );
};

export default ModalContent;
