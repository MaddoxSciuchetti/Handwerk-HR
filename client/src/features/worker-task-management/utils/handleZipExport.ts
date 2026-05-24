import JSZip from 'jszip';
import { fetchCloudUrl } from '../api/index.api';
import { File_Request } from '../types/index.types';

async function handleZipExport(fetchFiles: File_Request[] | undefined) {
  const zip = new JSZip();

  const fetchPromises = fetchFiles?.map(async (value) => {
    const blob = await fetchCloudUrl(value.fileUrl);
    const fileName = value.name.split('/').pop() ?? 'file';
    zip.file(fileName, blob);
  });

  await Promise.all(fetchPromises ?? []);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = 'archive.zip';
  link.click();
}

export default handleZipExport;
