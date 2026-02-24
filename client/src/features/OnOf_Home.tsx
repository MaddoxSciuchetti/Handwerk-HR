import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FormInputs } from '@/schemas/zodSchema';
import { deleteTaskApi, fetchNameData, postOffboardingData } from '@/lib/api';
import { useSidebar } from '@/components/ui/sidebar';
import SearchHeader from '@/components/SearchHeader';
import HandwerkerTable from '@/components/HandwerkerTable';
import { delete_user } from '@/types/api_response';
import useAuth from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import HomeModal from '@/components/home/HomeModal';

type FormType = 'Onboarding' | 'Offboarding';

type EmployeeForm = {
  form_type: FormType;
};

export type OffboardingItem = {
  employee_forms: EmployeeForm[];
  id: number;
  nachname: string;
  vorname: string;
};

function OnOf_Home() {
  const { user, isLoading, isError } = useAuth();
  const navigate = useNavigate({ from: '/' });
  const queryClient = useQueryClient();
  const { toggleSidebar } = useSidebar();
  const [modal, setModal] = useState<boolean>(false);
  const [search, setSearch] = useState('');

  const { data, error, isSuccess } = useQuery<OffboardingItem[]>({
    queryKey: ['offboarding'],
    queryFn: fetchNameData,
  });

  const filtered = data?.filter((item) =>
    item.vorname.toLowerCase().includes(search.toLowerCase())
  );

  const deleteTask = async (taskId: number): Promise<delete_user> => {
    const response = await deleteTaskApi(taskId);
    return response;
  };

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboarding'] });
    },
  });

  const onSubmit = useMutation({
    mutationFn: async (data: FormInputs) => {
      const response = await postOffboardingData(data);
      return response;
    },
    onSuccess: async (response) => {
      if (response.success) {
        await queryClient.invalidateQueries({
          queryKey: ['offboarding'],
          refetchType: 'all',
        });
        toggleModal();
      }
    },
    onError: (error) => {
      throw new Error(
        'Fehler beim Hinzufügen des Mitarbeiters: ' + error.message
      );
    },
  });

  const handleNavigate = (taskId: number, form_type: FormType) => {
    navigate({
      to: '/user/$Id',
      params: { Id: String(taskId) },
      search: { param1: form_type },
    });
  };

  const getFirstFormType = (item: OffboardingItem) => {
    return item.employee_forms[0]?.form_type;
  };
  const toggleModal = () => {
    setModal((prev) => !prev);
    toggleSidebar();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center mt-16">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center mt-16 space-y-2">
        <h1 className="text-3xl font-bold">Error loading user</h1>
        <p className="text-red-500">Please try again later</p>
      </div>
    );
  }

  if (error) return <div>{error.message}</div>;
  if (isSuccess && data.length === 0)
    return <div>Bitte erstelle dein ersten Handwerker</div>;

  return (
    <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
      <SearchHeader
        toggleModal={toggleModal}
        search={search}
        setSearch={setSearch}
      />
      <HandwerkerTable
        filtered={filtered}
        form_type={getFirstFormType}
        onRemove={deleteTaskMutation.mutate}
        gotopage={handleNavigate}
      />
      <HomeModal modal={modal} toggleModal={toggleModal} onSubmit={onSubmit} />
    </div>
  );
}

export default OnOf_Home;
