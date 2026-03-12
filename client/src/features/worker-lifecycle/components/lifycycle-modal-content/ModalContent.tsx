import MediumWrapper from '@/components/modal/modalSizes/MediumWrapper';
import { useState } from 'react';
import { FormType } from '../../types/index.types';
import RadioSelect from './RadioSelect';
import { WorkerForm } from './WorkerForm';

type ModalProps = {
  toggleModal: () => void;
  className?: string;
};

const ModalContent = ({ toggleModal }: ModalProps) => {
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
            toggleModal={toggleModal}
          />
        )}
      </div>
    </MediumWrapper>
  );
};

export default ModalContent;
