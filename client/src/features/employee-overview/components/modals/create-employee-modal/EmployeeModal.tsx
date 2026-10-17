import useCreateEmployee from '@/features/employee-overview/hooks/useCreateEmployee';
import FormModalAdd from './FormModal.Add';

function ModalMitarbeiter({ toggleModal }: { toggleModal: () => void }) {
  const { register, handleSubmit, onFormSubmit, errors, isError, error } =
    useCreateEmployee(toggleModal);
  return (
    <>
      <FormModalAdd
        handleSubmit={handleSubmit}
        register={register}
        errors={errors}
        onFormSubmit={onFormSubmit}
        isError={isError}
        error={error}
      />
    </>
  );
}

export default ModalMitarbeiter;
