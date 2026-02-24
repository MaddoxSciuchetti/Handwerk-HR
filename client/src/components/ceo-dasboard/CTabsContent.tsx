import { TabsContent } from "@/components/ui/tabs";
import { AccordionDemo } from "../admin_data/CAccordion";
import { TEmployForm } from "@/features/Ceo_Dashboard";
import { SetStateAction } from "react";

type CeoTabsContentProps = {
    selectedUser: string;
    cleanData: Array<[string, TEmployForm]>;
    currentBSBEmployee: TEmployForm;
    setModalOpen: (value: SetStateAction<boolean>) => void;
};

function CeoTabsContent({
    selectedUser,
    cleanData,
    currentBSBEmployee,
    setModalOpen,
}: CeoTabsContentProps) {
    return (
        <TabsContent value={selectedUser} className="mt-10">
            <AccordionDemo
                cleanData={cleanData}
                user={selectedUser}
                data={currentBSBEmployee}
                onTaskClick={() => setModalOpen(true)}
            />
        </TabsContent>
    );
}

export default CeoTabsContent;
