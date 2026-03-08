import ModalSchell from '@/features/employee-overview/components/reusable/ModalSchell';
import useRootForm from '@/hooks/useRootForm';
import { DescriptionData } from '@/types/api.types';
import { Dispatch, SetStateAction } from 'react';
import {
  AddDescriptionMutation,
  EditDescriptionMutation,
} from '../types/mutation.types';
import TemplateForm from './TemplateForm';

type TemplateModalProps = {
  editDescriptionMutation: EditDescriptionMutation;
  handleAddSubmitMutation: AddDescriptionMutation;
  form_field_id: number | null | undefined;
  description: string | null | undefined;
  owner: string | null | undefined;
  template_type?: 'ONBOARDING' | 'OFFBOARDING';
  OnboardingData?: DescriptionData[] | undefined;
  OffboardingData?: DescriptionData[] | undefined;
  mode: 'EDIT' | 'ADD' | undefined;
  setMode: Dispatch<SetStateAction<'EDIT' | 'ADD' | undefined>>;
  toggleModal: () => void;
  setModalState: Dispatch<
    SetStateAction<{
      selectedItem: {
        form_field_id: number | null | undefined;
        description: string | null | undefined;
        owner: string | null | undefined;
      } | null;
    }>
  >;
};

function TemplateModal({
  editDescriptionMutation,
  handleAddSubmitMutation,
  form_field_id,
  description,
  owner,
  template_type,
  mode,
  setMode,
  toggleModal,
  setModalState,
}: TemplateModalProps) {
  const { selectedValue, setSelectedValue } = useRootForm(owner);

  return (
    <ModalSchell>
      <TemplateForm
        setModalState={setModalState}
        toggleModal={toggleModal}
        editDescriptionMutation={editDescriptionMutation}
        handleAddSubmitMutation={handleAddSubmitMutation}
        selectedValue={selectedValue}
        description={description}
        setSelectedValue={setSelectedValue}
        mode={mode}
        setMode={setMode}
        template_type={template_type}
        form_field_id={mode === 'EDIT' ? form_field_id : undefined}
      />
    </ModalSchell>
  );
}
export default TemplateModal;
