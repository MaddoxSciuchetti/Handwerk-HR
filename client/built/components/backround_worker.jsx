import { useState } from "react";
import { Button } from "./ui/button";
import FileUpload01 from "./ui/file_upload/form-main";
import { useMutation, useQuery, useQueryClient, } from "@tanstack/react-query";
import { fetchFileData } from "@/lib/api";
import { deleteFileData } from "@/lib/api";
import { useToggleModal } from "@/hooks/use-toggleModal";
export const fileIcon = (content_type) => {
    if (content_type.startsWith("/image"))
        return "🖼️";
    if (content_type.includes("pdf"))
        return "📄";
    if (content_type.includes("document") || content_type.includes("word"))
        return "📝";
    if (content_type.includes("excel") || content_type.includes("spreadsheet"))
        return "📊";
};
export const getFileName = (url, originalName) => {
    return originalName || url.split("/").pop() || "unknown file";
};
function Worker_Backround({ id }) {
    const [setModal, setModalState] = useState(false);
    const { data: fetchFiles, error, isLoading, isFetching, } = useQuery({
        queryKey: ["historyData", id],
        queryFn: () => fetchFileData(id),
    });
    console.log("Is fetching", isFetching);
    console.log(id);
    console.log("fetchfiles", fetchFiles);
    const queryClient = useQueryClient();
    const { mutate: deleteFiles } = useMutation({
        mutationFn: (fileId) => deleteFileData(fileId),
        onMutate: async (fileId) => {
            await queryClient.cancelQueries({ queryKey: ["historyData", id] });
            queryClient.setQueryData(["historyData", id], (old) => old?.filter((file) => file.id !== fileId) || []);
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ["historyData", id] });
            console.log("this is the invalidation number");
        },
    });
    const { toggleModal } = useToggleModal();
    const openModal = () => {
        toggleModal();
        setModalState(true);
    };
    const closeModal = () => {
        toggleModal();
        setModalState(false);
    };
    return (<>
            <div className="text-right ">
                {isLoading ? (<div className="flex items-center justify-center min-h-100">
                        {" "}
                        Loading state{" "}
                    </div>) : (<div className="flex flex-row justify-end">
                        <img className=" flex flex-end cursor-pointer" onClick={openModal} src="/public/assets/Copy Plus Filled Icon (1).svg"/>
                    </div>)}

                {!fetchFiles || fetchFiles.length === 0 ? (<div className="flex items-center justify-center min-h-100">
                        Keine Hochgeladenen Dateien
                    </div>) : (fetchFiles && (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                            {fetchFiles.map((file, index) => (<div key={index} className=" rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors outline">
                                    <Button size={"icon-sm"} variant={"outline"} onClick={(e) => {
                    e.stopPropagation();
                    deleteFiles(file.id);
                }}>
                                        X
                                    </Button>
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">
                                            {fileIcon(file.content_type)}
                                        </div>
                                        <p className="text-sm font-medium truncate" onClick={() => window.open(file.cloud_url, "_blank")}>
                                            {getFileName(file.cloud_url, file.original_filename)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(file.uploaded_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>))}
                        </div>))}
            </div>

            {setModal && (<div className="fixed inset-0 z-50 flex">
                    <div onClick={closeModal} className="fixed inset-0 bg-black/50 cursor-pointer" aria-label="Close modal"/>
                    <FileUpload01 setModal={setModalState} id={id}/>
                </div>)}
        </>);
}
export default Worker_Backround;
