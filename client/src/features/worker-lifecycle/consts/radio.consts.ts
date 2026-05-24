import { AddWorker } from '../schemas/zod.schemas';

export type RadioOption = {
  id: string;
  value: AddWorker['type'];
  title: string;
  description: string;
};

export const OPTIONS: RadioOption[] = [
  {
    id: 'radio-onboarding',
    value: 'Onboarding',
    title: 'Onboarding',
    description: 'Onboarde ein Mitarbeiter',
  },
  {
    id: 'radio-offboarding',
    value: 'Offboarding',
    title: 'Offboarding',
    description: 'Offboarde ein Mitarbeiter',
  },
];
