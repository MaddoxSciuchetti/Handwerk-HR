import ErrorAlert from '@/components/alerts/ErrorAlert';
import FormFields from '@/components/form/FormFields';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import useAdminModal from '../hooks/use-adminModal';
import { TCloseModal } from '../types/adminModal.types';

function ReminderModal({ onClose }: TCloseModal) {
  const { isError, isSuccess, onSubmit, register, handleSubmit, errors } =
    useAdminModal();

  return (
    <div className="max-h-min mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl w-2xl">
      <div className="flex items-center gap-10 justify-center mb-6 m-10 ">
        <form
          className="flex flex-col gap-5 w-xl justify-center "
          onSubmit={handleSubmit(onSubmit)}
        >
          <p>Schicke eine Erinnerung</p>
          <div className="flex flex-row gap-3">
            <FormFields
              placeholder="Email"
              errors={errors}
              name="email"
              register={register}
            />
            <FormFields
              className="w-full"
              placeholder="Betreff"
              errors={errors}
              name="subject"
              register={register}
            />
          </div>
          <Textarea
            className="rounded-xl"
            placeholder="Nachricht"
            {...register('test')}
          ></Textarea>

          {isSuccess && (
            <div className="text-green-600">
              <p>Email gesendet</p>
            </div>
          )}
          {isError && <ErrorAlert />}
          <Button
            className="rounded-xl"
            type={isSuccess ? 'button' : 'submit'}
            variant={'outline'}
            onClick={isSuccess ? onClose : undefined}
          >
            {isSuccess ? (
              <span className="text-green-700 cursor-pointer">Schliessen</span>
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
