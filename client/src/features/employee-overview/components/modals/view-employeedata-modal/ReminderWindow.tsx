import ErrorAlert from '@/components/alerts/ErrorAlert';
import FormFields from '@/components/form/FormFields';
import { Button } from '../../../../../components/ui/button';
import { Textarea } from '../../../../../components/ui/textarea';
import useAdminModal from '../../../hooks/useAdminModal';
import { TCloseModal } from '../../../types/adminModal.types';

function ReminderWindow({ onClose }: TCloseModal) {
  const { isError, isSuccess, onSubmit, register, handleSubmit, errors } =
    useAdminModal();

  return (
    <form
      className="flex w-full flex-col justify-center gap-5"
      onSubmit={handleSubmit(onSubmit)}
    >
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
        <div className="text-[var(--status-success-foreground)]">
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
          <span className="cursor-pointer text-[var(--status-success-foreground)]">
            Schliessen
          </span>
        ) : (
          <span>Senden</span>
        )}
      </Button>
    </form>
  );
}

export default ReminderWindow;
