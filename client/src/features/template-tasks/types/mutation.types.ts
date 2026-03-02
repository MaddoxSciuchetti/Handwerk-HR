import { NewDescriptionField } from '@/types/api.types';
import { UseMutateFunction } from '@tanstack/react-query';
import { EditDescriptionData } from './taskForm.types';

export type EditDescriptionMutation = UseMutateFunction<
  EditDescriptionData,
  Error,
  EditDescriptionData,
  unknown
>;

export type AddDescriptionMutation = UseMutateFunction<
  NewDescriptionField,
  Error,
  {
    description: string;
    template_type: 'ONBOARDING' | 'OFFBOARDING';
    owner: string;
  },
  unknown
>;
