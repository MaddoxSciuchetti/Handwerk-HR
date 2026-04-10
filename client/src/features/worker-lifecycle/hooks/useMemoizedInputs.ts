import { useMemo } from 'react';
import { Inputs } from '../consts/form.consts';

export function useMemoizedInputs(type: 'Onboarding' | 'Offboarding') {
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
