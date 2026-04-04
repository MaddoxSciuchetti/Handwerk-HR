import { create } from 'zustand';
import { RegisterOrgStep1Values } from '../schemas/auth.schemas';

type RegisterOrgState = {
  step: 1 | 2;
  step1Data: RegisterOrgStep1Values | null;
  setStep: (step: 1 | 2) => void;
  setStep1Data: (data: RegisterOrgStep1Values) => void;
  reset: () => void;
};

export const useRegisterOrgStore = create<RegisterOrgState>((set) => ({
  step: 1,
  step1Data: null,
  setStep: (step) => set({ step }),
  setStep1Data: (data) => set({ step1Data: data }),
  reset: () => set({ step: 1, step1Data: null }),
}));
