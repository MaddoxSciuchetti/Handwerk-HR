import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProcessData } from "@/lib/api";
const ProcessDataContext = createContext(undefined);
export const ProcessDataProvider = ({ children }) => {
    const getProcessData = (id, form_type) => {
        const queryResult = useQuery({
            queryKey: ["processData", id, form_type],
            queryFn: () => fetchProcessData(id, form_type),
        });
        console.log(queryResult.data);
        const completedTasksCount = queryResult.data?.form?.fields
            ? queryResult.data.form.fields.filter((field) => field.status === "erledigt").length
            : null;
        return {
            ...queryResult,
            completedTasksCount,
        };
    };
    return (<ProcessDataContext.Provider value={{ getProcessData }}>
      {children}
    </ProcessDataContext.Provider>);
};
export const useProcessDataContext = () => {
    const context = useContext(ProcessDataContext);
    if (context === undefined) {
        throw new Error("useProcessDataContext must be used within a ProcessDataProvider");
    }
    return context;
};
export const useProcessData = (id, form_type) => {
    const { getProcessData } = useProcessDataContext();
    return getProcessData(id, form_type);
};
