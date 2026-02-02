import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProcessData } from "@/lib/api";
import { UpdatedAiResponse } from "@/components/file-exports/FileExport-Modal";

interface ProcessDataContextType {
  getProcessData: (
    id: number,
    form_type: string,
  ) => {
    data: UpdatedAiResponse | undefined;
    isLoading: boolean;
    error: Error | null;
    completedTasksCount: number | null;
  };
}

const ProcessDataContext = createContext<ProcessDataContextType | undefined>(
  undefined,
);

interface ProcessDataProviderProps {
  children: ReactNode;
}

export const ProcessDataProvider = ({ children }: ProcessDataProviderProps) => {
  const getProcessData = (id: number, form_type: string) => {
    const queryResult = useQuery<UpdatedAiResponse, Error>({
      queryKey: ["processData", id, form_type],
      queryFn: () => fetchProcessData(id, form_type),
    });

    console.log(queryResult.data);

    const completedTasksCount = queryResult.data?.form?.fields
      ? queryResult.data.form.fields.filter(
          (field) => field.status === "erledigt",
        ).length
      : null;

    return {
      ...queryResult,
      completedTasksCount,
    };
  };

  return (
    <ProcessDataContext.Provider value={{ getProcessData }}>
      {children}
    </ProcessDataContext.Provider>
  );
};

export const useProcessDataContext = () => {
  const context = useContext(ProcessDataContext);
  if (context === undefined) {
    throw new Error(
      "useProcessDataContext must be used within a ProcessDataProvider",
    );
  }
  return context;
};

export const useProcessData = (id: number, form_type: string) => {
  const { getProcessData } = useProcessDataContext();
  return getProcessData(id, form_type);
};
