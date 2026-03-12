import useCreateEmployee from '@/features/employee-overview/hooks/useCreateEmployee';
import SmallWrapper from '../../../../../components/modal/modalSizes/SmallWrapper';
import FormModalAdd from './FormModal.Add';

function ModalMitarbeiter({ toggleModal }: { toggleModal: () => void }) {
  const { register, handleSubmit, onFormSubmit, errors, isError, error } =
    useCreateEmployee(toggleModal);
  return (
    <SmallWrapper className="items-stretch justify-start overflow-hidden ">
      <FormModalAdd
        handleSubmit={handleSubmit}
        register={register}
        errors={errors}
        onFormSubmit={onFormSubmit}
        isError={isError}
        error={error}
      />
    </SmallWrapper>
  );
}

export default ModalMitarbeiter;
