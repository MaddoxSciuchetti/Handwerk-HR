import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { templateMutations } from '../query-options/mutations/template.mutations';

function useEditDescription() {
  const [tab, setTab] = useState<'ONBOARDING' | 'OFFBOARDING'>('ONBOARDING');

  const { mutate: editDescriptionMutation } = useMutation(
    templateMutations.update()
  );

  return {
    editDescriptionMutation,
    tab,
    setTab,
  };
}

export default useEditDescription;
