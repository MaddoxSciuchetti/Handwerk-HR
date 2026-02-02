import { useState } from "react";
import { Button } from "./ui/button";
import FileUpload01 from "./ui/file_upload/form-main";
import { useQuery } from "@tanstack/react-query";
import { fetchFileData } from "@/lib/api";

interface Worker_Backround {
  id: number;
}

export type File_Request = {
  id: number;
  employee_form_id: number;
  original_filename: string;
  content_type: string;
  cloud_url: string;
  cloud_key: string;
  uploaded_at: Date;
};

export const fileIcon = (content_type: string) => {
  if (content_type.startsWith("/image")) return "🖼️";
  if (content_type.includes("pdf")) return "📄";
  if (content_type.includes("document") || content_type.includes("word"))
    return "📝";
  if (content_type.includes("excel") || content_type.includes("spreadsheet"))
    return "📊";
};

export const getFileName = (url: string, originalName: string) => {
  return originalName || url.split("/").pop() || "unknown file";
};
function Worker_Backround({ id }: Worker_Backround) {
  const [setModal, setModalState] = useState<boolean>(false);

  const {
    data: fetchFiles,
    error,
    isLoading,
  } = useQuery<File_Request[]>({
    queryKey: ["historyData", id],
    queryFn: () => fetchFileData(id),
  });

  return (
    <>
      <div className="outline text-right">
        {isLoading ? <div> Loading state </div> : ""}
        <Button variant={"secondary"} onClick={() => setModalState(true)}>
          Hinzufügen
        </Button>

        {fetchFiles && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {fetchFiles.map((file, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => window.open(file.cloud_url, "_blank")}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {fileIcon(file.content_type)}
                  </div>
                  <p className="text-sm font-medium truncate">
                    {getFileName(file.cloud_url, file.original_filename)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(file.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {setModal && <FileUpload01 setModal={setModalState} id={id} />}
      </div>
    </>
  );
}

export default Worker_Backround;
