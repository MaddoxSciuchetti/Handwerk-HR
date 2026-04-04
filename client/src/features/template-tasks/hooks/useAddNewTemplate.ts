import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { templateV2Mutations } from '../query-options/mutations/templateV2.mutations';
import {
  engagementTypeFromTab,
  TemplateTab,
} from '../utils/engagementTypeFromTab';

function useAddNewTemplate(onClose: () => void) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phaseTab, setPhaseTab] = useState<TemplateTab>('ONBOARDING');

  const { mutate, isPending } = useMutation(
    templateV2Mutations.createTemplate()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    mutate(
      {
        name: trimmed,
        description: description.trim() || undefined,
        type: engagementTypeFromTab(phaseTab),
      },
      { onSuccess: () => onClose() }
    );
  };

  return {
    name,
    setName,
    description,
    setDescription,
    phaseTab,
    setPhaseTab,
    handleSubmit,
    isPending,
  };
}

export default useAddNewTemplate;
