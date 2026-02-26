import { Dispatch, SetStateAction } from 'react';
import {
  newField,
  TCreateTaskMutation,
  TDescriptionData,
  TEditMutation,
} from '@/types/api';
import { TEmployeeResponse } from '@/zod-schemas/schema';
import useRootForm from '@/hooks/use-Root-Form';
import RootForm from './RootForm';
import { SubmitHandlerProps } from '@/types/rootDescription';
import { UseMutateFunction } from '@tanstack/react-query';
import { EditDescriptionData } from '@/lib/api';

type RootModalProps = {
  editDescriptionMutation: UseMutateFunction<
    EditDescriptionData,
    Error,
    EditDescriptionData,
    unknown
  >;
  handleAddSubmitMutation: UseMutateFunction<
    newField,
    Error,
    {
      description: string;
      template_type: 'ONBOARDING' | 'OFFBOARDING';
      owner: string;
    },
    unknown
  >;
  form_field_id: number | null | undefined;
  description: string | null | undefined;
  owner: string | null | undefined;
  template_type?: 'ONBOARDING' | 'OFFBOARDING';
  EmployeeData: TEmployeeResponse | undefined;
  OnboardingData?: TDescriptionData[] | undefined;
  OffboardingData?: TDescriptionData[] | undefined;
  mode: 'EDIT' | 'ADD' | undefined;
  setMode: Dispatch<SetStateAction<'EDIT' | 'ADD' | undefined>>;
};

function RootModal({
  editDescriptionMutation,
  handleAddSubmitMutation,
  form_field_id,
  description,
  owner,
  template_type,
  EmployeeData,
  mode,
  setMode,
}: RootModalProps) {
  const { selectedValue, setSelectedValue } = useRootForm(owner);

  return (
    <>
      <div className="flex flex-col max-h-100 min-h-120 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-2xl">
        <div className="flex flex-col max-w-xl h-full w-xl my-10 items-start">
          <RootForm
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
export default RootModal;
