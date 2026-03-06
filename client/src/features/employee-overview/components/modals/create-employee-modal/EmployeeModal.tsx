import useCreateEmployee from '@/features/employee-overview/hooks/useCreateEmployee';
import FormModalAdd from './FormModal.Add';

function ModalMitarbeiter({ toggleModal }: { toggleModal: () => void }) {
  const { register, handleSubmit, onFormSubmit, errors } =
    useCreateEmployee(toggleModal);
  return (
    <>
      <div className="flex flex-col max-h-100  min-h-120 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-xl">
        <div className="flex flex-col max-w-xl h-full w-xl  my-10">
          <div className="flex mx-auto flex-col space-y-4 w-80 ">
            <FormModalAdd
              handleSubmit={handleSubmit}
              register={register}
              errors={errors}
              onFormSubmit={onFormSubmit}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default ModalMitarbeiter;
