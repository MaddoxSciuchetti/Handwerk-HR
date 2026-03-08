import { UseMutateFunction } from '@tanstack/react-query';
import { ItemUser } from './index.types';

export type AddWorkerMutation = UseMutateFunction<
  ItemUser,
  Error,
  | {
      vorname: string;
      nachname: string;
      email: string;
      geburtsdatum: string;
      adresse: string;
      eintrittsdatum: string;
      position: string;
      type: 'Onboarding';
    }
  | {
      vorname: string;
      nachname: string;
      email: string;
      geburtsdatum: string;
      adresse: string;
      eintrittsdatum: string;
      position: string;
      type: 'Offboarding';
      austrittsdatum: string;
    },
  unknown
>;
