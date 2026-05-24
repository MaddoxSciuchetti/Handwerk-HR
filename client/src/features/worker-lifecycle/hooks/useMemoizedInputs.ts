import { useMemo } from 'react';
import { Inputs } from '../consts/form.consts';
import { AddWorker } from '../schemas/zod.schemas';

export function useMemoizedInputs(type: AddWorker['type']) {
  return useMemo(() => {
    const offboardingInputs =
      type === 'Offboarding'
        ? [
            {
              name: 'austrittsdatum' as const,
              placeholder: 'Austrittsdatum DD.MM.YYYY',
              required: type === 'Offboarding',
            },
          ]
        : [];
    return [...Inputs, ...offboardingInputs];
  }, [type]);
}
