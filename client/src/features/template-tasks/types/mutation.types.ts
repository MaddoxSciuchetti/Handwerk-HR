import { EditDescriptionData } from '@/apis/index.apis';
import { newField } from '@/types/api.types';
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
