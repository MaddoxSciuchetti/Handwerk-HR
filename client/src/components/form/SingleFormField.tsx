import { ChangeEvent, KeyboardEvent } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type SingleFormFieldProps<T extends string | number> = {
  label: string;
  id: string;
  type: string;
  value: T;
  setValue: (value: T) => void;
  action?: () => void;
};

const SingleFormField = <T extends string | number>({
  label,
  id,
  type,
  value,
  setValue,
  action,
}: SingleFormFieldProps<T>) => {
  return (
    <>
      <Label>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value as T)
        }
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            action?.();
          }
        }}
        className="text-white bg-gray-600 border-gray-500"
      />
    </>
  );
};

export default SingleFormField;
