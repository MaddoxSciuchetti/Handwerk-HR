import { DescriptionFieldResponse } from '@/types/api.types';
import { ReactNode } from 'react';

export type UpdatedAiResponse = Omit<DescriptionFieldResponse, 'name'> & {
  user: {
    id: number;
    vorname: string;
    nachname: string;
  };
};
export type ProcessDataProviderProps = {
  children: ReactNode;
};

export type ProcessDataContextType = {
  getProcessData: (
    id: number,
    form_type: string
  ) => {
    data: UpdatedAiResponse | undefined;
    isLoading: boolean;
    error: Error | null;
    completedTasksCount: number | null;
    totalTasks: number | null;
  };
};
