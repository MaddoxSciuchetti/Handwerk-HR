import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import { Dispatch, SetStateAction } from 'react';

type RadioSelectProps = {
  selectedOption: AddWorker['type'] | null;
  setSelectedOption: Dispatch<SetStateAction<AddWorker['type'] | null>>;
};

const RadioSelect = ({
  setSelectedOption,
  selectedOption,
}: RadioSelectProps) => {
  return (
    <>
      <RadioGroup
        className="h-full flex flex-row items-center"
        onValueChange={(value) => setSelectedOption(value as AddWorker['type'])}
        value={selectedOption}
      >
        <FieldLabel
          htmlFor="plus-plan"
          className={`${selectedOption === 'Onboarding' ? 'bg-accent text-accent-foreground scale-105' : ''} cursor-pointer rounded-xl p-3 transition-colors hover:bg-accent hover:text-accent-foreground `}
        >
          <Field orientation="horizontal">
            <FieldContent className="text-left">
              <FieldTitle>Onboarding</FieldTitle>
              <FieldDescription>Onboarde ein Mitarbeiter</FieldDescription>
            </FieldContent>
            <RadioGroupItem value="Onboarding" id="plus-plan" />
          </Field>
        </FieldLabel>
        <FieldLabel
          htmlFor="pro-plan"
          className={`${selectedOption === 'Offboarding' ? 'active bg-accent text-accent-foreground scale-105' : ''} cursor-pointer rounded-xl p-3 transition-colors hover:bg-accent hover:text-accent-foreground `}
        >
          <Field orientation="horizontal">
            <FieldContent className="text-left">
              <FieldTitle>Offboarding</FieldTitle>
              <FieldDescription className="">
                Offboarde ein Mitarbeiter
              </FieldDescription>
            </FieldContent>
            <RadioGroupItem value="Offboarding" id="pro-plan" />
          </Field>
        </FieldLabel>
      </RadioGroup>
    </>
  );
};

export default RadioSelect;
