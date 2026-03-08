import useCreateEmployee from '@/features/employee-overview/hooks/useCreateEmployee';
import SmallWrapper from '../../../../../components/modal/modalSizes/SmallWrapper';
import FormModalAdd from './FormModal.Add';

function ModalMitarbeiter({ toggleModal }: { toggleModal: () => void }) {
  const { register, handleSubmit, onFormSubmit, errors } =
    useCreateEmployee(toggleModal);
  return (
    <SmallWrapper>
      <FormModalAdd
        handleSubmit={handleSubmit}
        register={register}
        errors={errors}
        onFormSubmit={onFormSubmit}
      />
    </SmallWrapper>
  );
}

export default ModalMitarbeiter;
