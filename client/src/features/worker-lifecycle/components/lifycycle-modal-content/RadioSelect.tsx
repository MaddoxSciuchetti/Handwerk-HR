import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Dispatch, SetStateAction } from 'react';

type RadioSelectProps<T> = {
  selectedOption: T | null;
  setSelectedOption: Dispatch<SetStateAction<T | null>>;
  options: { id: string; value: T; title: string; description: string }[];
};

const optionCardClassName =
  'cursor-pointer rounded-xl border border-border bg-background p-4 shadow-none ring-0 transition-colors hover:bg-muted/50 has-data-checked:border-border has-data-checked:bg-muted/50 has-data-checked:shadow-none dark:has-data-checked:border-border dark:has-data-checked:bg-muted/50';

const RadioSelect = <T,>({
  setSelectedOption,
  selectedOption,
  options,
}: RadioSelectProps<T>) => {
  return (
    <RadioGroup
      className="flex flex-col gap-3"
      onValueChange={(value) => setSelectedOption(value as T)}
      value={selectedOption as string}
    >
      {options.map((option) => (
        <FieldLabel
          key={option.id}
          htmlFor={option.id}
          className={cn(
            optionCardClassName,
            selectedOption === option.value && 'bg-muted/50'
          )}
        >
          <Field
            orientation="horizontal"
            className="items-center justify-between gap-3"
          >
            <FieldContent className="text-left">
              <FieldTitle>{option.title}</FieldTitle>
              <FieldDescription>{option.description}</FieldDescription>
            </FieldContent>
            <RadioGroupItem value={option.value as string} id={option.id} />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  );
};

export default RadioSelect;
