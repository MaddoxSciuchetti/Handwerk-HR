import useAuth from '@/features/user-profile/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CreateWorkerRequest } from '../api';
import { workerLifecycleMutations } from '../query-options/mutations/worker-lifycycle.mutations';
import { AddWorker, addWorkerSchema } from '../schemas/zod.schemas';

export function useAddWorker(type: AddWorker['type'], toggleModal: () => void) {
  const { user } = useAuth();
  const {
    mutateAsync: addWorkerMutation,
    isError,
    error,
    isPending,
  } = useMutation(workerLifecycleMutations.addWorker());

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AddWorker>({
    resolver: zodResolver(addWorkerSchema),
    defaultValues: {
      type: type,
    },
    criteriaMode: 'all',
  });

  const submitWorkerForm = async (data: AddWorker) => {
    if (!user?.id) {
      toast.error('Benutzerdaten konnten nicht geladen werden');
      return;
    }

    const workerPayload: CreateWorkerRequest = {
      firstName: data.vorname,
      lastName: data.nachname,
      email: data.email,
      birthday: data.geburtsdatum,
      street: data.adresse,
      entryDate: data.eintrittsdatum,
      exitDate: data.type === 'Offboarding' ? data.austrittsdatum : undefined,
      position: data.position,
      engagementType:
        data.type === 'Offboarding' ? 'offboarding' : 'onboarding',
      responsibleUserId: user.id,
      startDate: data.eintrittsdatum,
      endDate: data.type === 'Offboarding' ? data.austrittsdatum : undefined,
      templateId: data.templateId,
    };

    await addWorkerMutation(workerPayload);
    toast.success('Mitarbeiter erstellt und Benachrichtigungen versendet');
    toggleModal();
  };

  return {
    register,
    handleSubmit,
    control,
    submitWorkerForm,
    errors,
    isError,
    error,
    isPending,
  };
}
