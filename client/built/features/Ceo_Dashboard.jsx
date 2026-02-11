import { AccordionDemo } from "@/components/admin_data/CAccordion";
import AdminModal from "@/components/admin_data/AdminModal";
import { Button } from "@/components/ui/button";
import useCeoDashboard from "@/hooks/useCeoDashboard";
function Ceo_Dashboard() {
    const { allEmployeeData, uniqueHandwerkerProBSBEmployee, setSelectedUser, setModalOpen, modal, selectedUser, currentBSBEmployee, isLoading, error, cleanData, } = useCeoDashboard();
    if (isLoading)
        return <div>Loading</div>;
    if (error)
        console.log(error);
    return (<>
            <div className=" w-full max-w-5xl h-150 rounded-2xl mx-auto p-6 shadow-gray-200 shadow-lg overflow-auto">
                <div className="items-center flex  w-full h-20 gap-3.5">
                    {uniqueHandwerkerProBSBEmployee.map((user) => (<Button variant={"outline"} key={user.owner} onClick={() => setSelectedUser(user.owner)} className={`flex flex-row cursor-pointer ${selectedUser === user.owner ? `underline transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 bg-gray-200` : `hover:bg-gray-100`}`}>
                            {user.owner}
                        </Button>))}
                </div>
                <div className="flex flex-col relative  w-full h-auto overflow-auto">
                    {selectedUser ? (<div>
                            <div>
                                <AccordionDemo cleanData={cleanData} user={selectedUser} data={currentBSBEmployee} onTaskClick={() => setModalOpen(true)}/>
                            </div>
                        </div>) : (<div>
                            Wähle ein Nutzer um seine Offenen Aufgaben zu sehen
                        </div>)}
                </div>
            </div>

            {modal && (<div className="fixed inset-0 z-50 flex">
                    <div onClick={() => setModalOpen(false)} className="fixed inset-0 bg-black/50 cursor-pointer" aria-label="Close modal"/>
                    <AdminModal onClose={() => setModalOpen(false)} selectedUser={selectedUser}/>
                </div>)}
        </>);
}
export default Ceo_Dashboard;
