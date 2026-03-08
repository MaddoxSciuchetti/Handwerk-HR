import useCreateEmployee from '@/features/employee-overview/hooks/useCreateEmployee';
import ModalSchell from '../../reusable/ModalSchell';
import FormModalAdd from './FormModal.Add';

function ModalMitarbeiter({ toggleModal }: { toggleModal: () => void }) {
  const { register, handleSubmit, onFormSubmit, errors } =
    useCreateEmployee(toggleModal);
  return (
    <ModalSchell>
      <FormModalAdd
        handleSubmit={handleSubmit}
        register={register}
        errors={errors}
        onFormSubmit={onFormSubmit}
      />
    </ModalSchell>
  );
}

export default ModalMitarbeiter;
