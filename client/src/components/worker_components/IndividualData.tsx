import { User } from "@/hooks/useAuth";
import { useEffect, useMemo } from "react";
import useCeoDashboard from "@/hooks/useCeoDashboard";
import { AccordionDemo, EmployeeGroup } from "../admin_data/CAccordion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type data = {
  user: User | undefined;
};

// function IndividualData({ user }: data) {
//   return (
//     <>
//       <div>Hello {user?.email}</div>
//       <div>These are your current tasks to fufill</div>
//       <AccordionDemo
//         data={selectUserData}
//         onTaskClick={() => setModalOpen(true)}
//       />
//     </>
//   );
// }

// export default IndividualData;
