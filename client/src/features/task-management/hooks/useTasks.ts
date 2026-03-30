import { useState } from "react";
import { WorkerTab } from "../types/index.types";

function useTasks() {
    const [activeTab, setActiveTab] = useState<WorkerTab>('form');
    const [fileDescriptionSearch, setFileDescriptionSearch] = useState('');
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [createIssueOpen, setCreateIssueOpen] = useState(false);
    const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);

    return {
        activeTab,
        setActiveTab,
        fileDescriptionSearch,
        setFileDescriptionSearch,
        isAddTaskModalOpen,
        setIsAddTaskModalOpen,
        createIssueOpen,
        setCreateIssueOpen,
        applyTemplateOpen,
        setApplyTemplateOpen,
    }
}

export default useTasks;