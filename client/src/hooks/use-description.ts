import { useSidebar } from '@/components/ui/sidebar';
import {
  formSchemaDesecription,
  formSchemaWithType,
} from '@/zod-schemas/zodSchema';
import { SubmitEvent, useState } from 'react';
import useEmployeeData from './use-employeeData';
import { toast } from 'sonner';
import useFetchTask from './use-fetchTask';
import useDeleteDescription from './use-DeleteDescription';
import useEditDescription from './use-editdescription';
import { addExtraField } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

function useDescription() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'ONBOARDING' | 'OFFBOARDING'>('ONBOARDING');
  const { EmployeeData } = useEmployeeData();
  const { data, OnboardingData, OffboardingData } = useFetchTask();
  const { toggleSidebar } = useSidebar();
  const { deleteDescription } = useDeleteDescription();
  const {
    modal,
    setModal,
    openEditModal,
    editDescription,
    modalState,
    toggleModal,
  } = useEditDescription();

  async function handleAddSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const formData = new FormData(event.currentTarget);
      const result = formSchemaWithType.safeParse(Object.fromEntries(formData));

      if (!result.success) return;

      await addExtraField(result.data);
      queryClient.invalidateQueries({ queryKey: ['description_root'] });
      toggleModal();
    } catch (error) {
      console.log(error);
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const formData = new FormData(event.currentTarget);
      const formValues = Object.fromEntries(formData);
      const result = formSchemaDesecription.safeParse(formValues);

      if (!result.success) {
        console.log('validation errors', result.error);
        return;
      }

      editDescription(result.data);
    } catch (error) {
      toast.error(`Ein Fehler ist aufgetreten ${error}`);
    }
  }

  const handleOpenModal = () => {
    setModal((prev) => !prev);
    toggleSidebar();
  };

  return {
    modal,
    modalState,
    openEditModal,
    data,
    deleteDescription,
    handleSubmit,
    handleAddSubmit,
    tab,
    setTab,
    OnboardingData,
    OffboardingData,
    handleOpenModal,
    EmployeeData,
  };
}

export default useDescription;
