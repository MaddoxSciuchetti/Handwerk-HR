import { AbsenceData } from '@/types/api';
import { Label } from '../../../../../components/ui/label';
import { FieldErrors, Path, UseFormRegister } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { Input } from '@/components/ui/input';

type LabeledInputProps = {
  name: Path<AbsenceData>;
  label: string;
  placeholder: string;
  register: UseFormRegister<AbsenceData>;
  errors: FieldErrors<AbsenceData>;
};

const LabeledInput = ({
  name,
  label,
  placeholder,
  register,
  errors,
}: LabeledInputProps) => {
  return (
    <>
      <Label>{label}</Label>
      <Input type="text" placeholder={placeholder} {...register(name)} />
      <ErrorMessage
        errors={errors}
        name={name}
        render={({ message }) => (
          <p className="text-red-400 text-sm">{message}</p>
        )}
      />
    </>
  );
};

export default LabeledInput;
