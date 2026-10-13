import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import type { Dispatch, SetStateAction } from 'react';
import { OPTIONS } from '../../consts/radio.consts';
import RadioSelect from './RadioSelect';
import { WorkerForm } from './WorkerForm';

type ModalContentProps = {
  toggleModal?: () => void;
  selectedOption: AddWorker['type'] | null;
  setSelectedOption: Dispatch<SetStateAction<AddWorker['type'] | null>>;
  /** When false, header provides Zurück (e.g. WorkerSidebar). */
  showInlineFormBackButton?: boolean;
  onQuestionnaire?: (draft: { engagementId: string }) => void;
};

const ModalContent = ({
  toggleModal,
  selectedOption,
  setSelectedOption,
  showInlineFormBackButton = true,
  onQuestionnaire,
}: ModalContentProps) => {
  if (selectedOption === null) {
    return (
      <RadioSelect
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}
        options={OPTIONS}
      />
    );
  }

  return (
    <WorkerForm
      setSelectedOption={setSelectedOption}
      type={selectedOption}
      toggleModal={toggleModal ?? (() => {})}
      showInlineFormBackButton={showInlineFormBackButton}
      onQuestionnaire={onQuestionnaire}
    />
  );
};

export default ModalContent;
