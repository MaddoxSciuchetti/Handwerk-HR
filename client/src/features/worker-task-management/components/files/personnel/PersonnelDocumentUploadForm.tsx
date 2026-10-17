import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EngagementType } from '@/features/worker-lifecycle/types/index.types';
import { useState } from 'react';
import { MaterialsEngagementPicker } from '../../materials/MaterialsEngagementPicker';
import type { PersonnelFolder } from '../../../api/personnelDocuments.api';
import { useUploadPersonnelDocument } from '../../../hooks/usePersonnelDocuments';
import { PERSONNEL_DOCUMENT_NAMES } from '../../../personnel-documents/personnelDocumentNames';
import { PersonnelFileDropzone } from './PersonnelFileDropzone';

type PersonnelDocumentUploadFormProps = {
  workerId: string;
  engagements: Array<{
    id: string;
    type: EngagementType;
    startDate: string | null;
  }>;
  folders: PersonnelFolder[];
  setModal: (open: boolean) => void;
};

export function PersonnelDocumentUploadForm({
  workerId,
  engagements,
  folders,
  setModal,
}: PersonnelDocumentUploadFormProps) {
  const [engagementId, setEngagementId] = useState(engagements[0]?.id ?? '');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const upload = useUploadPersonnelDocument(workerId);
  const selectedEngagement =
    engagements.find((item) => item.id === engagementId)?.id ??
    engagements[0]?.id ??
    '';

  const folderId = name.startsWith('folder:') ? name.slice('folder:'.length) : '';
  const submit = () => {
    if (!selectedEngagement || !name || !file) return;
    upload.mutate(
      {
        engagementId: selectedEngagement,
        name: folderId ? 'ordner' : name,
        folderId: folderId || undefined,
        file,
      },
      { onSuccess: () => setModal(false) }
    );
  };

  return (
    <SmallWrapper className="h-auto min-h-0 max-h-[85vh] overflow-y-auto">
      <CardContent className="flex w-full min-w-0 flex-col gap-4">
        {engagements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Kein Engagement vorhanden.
          </p>
        ) : (
          <>
            <MaterialsEngagementPicker
              engagements={engagements}
              value={selectedEngagement}
              onChange={setEngagementId}
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="personnel-document-name">Dokumentname</Label>
              <Select
                value={name || undefined}
                onValueChange={setName}
              >
                <SelectTrigger
                  id="personnel-document-name"
                  aria-label="Dokumentname"
                >
                  <SelectValue placeholder="Name wählen" />
                </SelectTrigger>
                <SelectContent>
                  {PERSONNEL_DOCUMENT_NAMES.filter((item) => item.value !== 'fragebogen').map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                  {folders
                    .filter((folder) => folder.engagementId === selectedEngagement)
                    .map((folder) => (
                      <SelectItem key={folder.id} value={`folder:${folder.id}`}>
                        {folder.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <PersonnelFileDropzone file={file} onFile={setFile} />
            <Button
              type="button"
              variant="outline"
              disabled={!name || !file || upload.isPending}
              onClick={submit}
            >
              {upload.isPending ? 'Hochladen...' : 'Hochladen'}
            </Button>
          </>
        )}
      </CardContent>
    </SmallWrapper>
  );
}
