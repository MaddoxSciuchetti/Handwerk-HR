import { EmployeeDataArray } from '@/features/employee-overview/schemas/schema';
import useRootForm from '@/hooks/use-Root-Form';
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
  EmployeeData: EmployeeDataArray | undefined;
  OnboardingData?: DescriptionData[] | undefined;
  OffboardingData?: DescriptionData[] | undefined;
  mode: 'EDIT' | 'ADD' | undefined;
  setMode: Dispatch<SetStateAction<'EDIT' | 'ADD' | undefined>>;
};

function TemplateModal({
  editDescriptionMutation,
  handleAddSubmitMutation,
  form_field_id,
  description,
  owner,
  template_type,
  EmployeeData,
  mode,
  setMode,
}: TemplateModalProps) {
  const { selectedValue, setSelectedValue } = useRootForm(owner);

  return (
    <>
      <div className="flex flex-col max-h-100 min-h-120 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-2xl">
        <div className="flex flex-col max-w-xl h-full w-xl my-10 items-start">
          <TemplateForm
            editDescriptionMutation={editDescriptionMutation}
            handleAddSubmitMutation={handleAddSubmitMutation}
            selectedValue={selectedValue}
            description={description}
            setSelectedValue={setSelectedValue}
            EmployeeData={EmployeeData}
            mode={mode}
            setMode={setMode}
            template_type={template_type}
            form_field_id={mode === 'EDIT' ? form_field_id : undefined}
          />
        </div>
      </div>
    </>
  );
}
export default TemplateModal;
