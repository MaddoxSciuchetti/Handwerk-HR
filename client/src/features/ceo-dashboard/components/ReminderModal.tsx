import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import useAdminModal from '../hooks/use-adminModal';
import { TCloseModal } from '../types/adminModal.type';
import FormFields from '@/components/form/FormFields';
import ErrorAlert from '@/components/alerts/ErrorAlert';

function ReminderModal({ onClose }: TCloseModal) {
  const { isError, isSuccess, onSubmit, register, handleSubmit, errors } =
    useAdminModal();

  return (
    <div className="max-h-min mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl w-2xl">
      <div className="flex items-center gap-10 justify-center mb-6 m-10 ">
        <form
          className="flex flex-col gap-5 w-md justify-center "
          onSubmit={handleSubmit(onSubmit)}
        >
          <p>Schicke eine Erinnerung</p>
          <FormFields
            placeholder="Email"
            errors={errors}
            name="email"
            register={register}
          />
          <FormFields
            placeholder="Betreff"
            errors={errors}
            name="subject"
            register={register}
          />
          <Textarea placeholder="Nachricht" {...register('test')}></Textarea>

          {isSuccess && (
            <div className="text-green-600">
              <p>Email gesendet</p>
            </div>
          )}
          {isError && <ErrorAlert />}
          <Button
            type={isSuccess ? 'button' : 'submit'}
            variant={'outline'}
            onClick={isSuccess ? onClose : undefined}
          >
            {isSuccess ? (
              <span className="text-green-700">Schliessen</span>
            ) : (
              <span>Senden</span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ReminderModal;
