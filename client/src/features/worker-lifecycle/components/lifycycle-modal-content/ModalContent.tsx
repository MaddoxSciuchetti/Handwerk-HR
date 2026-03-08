import MediumWrapper from '@/components/modal/modalSizes/MediumWrapper';
import { useState } from 'react';
import { FormType } from '../../types/index.types';
import { AddWorkerMutation } from '../../types/mutation.types';
import RadioSelect from './RadioSelect';
import { WorkerForm } from './WorkerForm';

type ModalProps = {
  toggleModal: () => void;
  addWorkerMutation: AddWorkerMutation;
  className?: string;
};

const ModalContent = ({ addWorkerMutation, toggleModal }: ModalProps) => {
  const [selectedOption, setSelectedOption] = useState<FormType | null>(null);

  return (
    <MediumWrapper>
      <div className="h-full w-xl max-w-xl">
        {selectedOption === null ? (
          <RadioSelect
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
          />
        ) : (
          <WorkerForm
            setSelectedOption={setSelectedOption}
            type={selectedOption}
            success={addWorkerMutation}
            toggleModal={toggleModal}
          />
        )}
      </div>
    </MediumWrapper>
  );
};

export default ModalContent;
