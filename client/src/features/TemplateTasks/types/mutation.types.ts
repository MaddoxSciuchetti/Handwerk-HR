import { EditDescriptionData } from '@/lib/api';
import { newField } from '@/types/api';
import { UseMutateFunction } from '@tanstack/react-query';

export type TEditDesription = UseMutateFunction<
  EditDescriptionData,
  Error,
  EditDescriptionData,
  unknown
>;

export type TAddDescription = UseMutateFunction<
  newField,
  Error,
  {
    description: string;
    template_type: 'ONBOARDING' | 'OFFBOARDING';
    owner: string;
  },
  unknown
>;
