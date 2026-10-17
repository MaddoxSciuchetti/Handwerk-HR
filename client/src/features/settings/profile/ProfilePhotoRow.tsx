import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GrowingItem, Items } from '@/features/settings/components/Table';
import { AvatarCropModal } from '@/features/sidebar/profile-upload-modal/AvatarCropModal';
import { Camera, UserRound } from 'lucide-react';
import { useRef, useState } from 'react';

type ProfilePhotoRowProps = {
  photoUrl?: string;
  isUploading?: boolean;
  onUploadPhoto: (file: File) => void;
};

export function ProfilePhotoRow({
  photoUrl,
  isUploading = false,
  onUploadPhoto,
}: ProfilePhotoRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const showPhoto = Boolean(photoUrl && photoUrl !== failedPhotoUrl);

  return (
    <>
      <Items state="default">
        <GrowingItem>
          <p className="typo-body-sm">Profil Foto</p>
        </GrowingItem>
        <div className="w-72">
          <Button
            type="button"
            variant="ghost"
            className="group relative h-16 w-16 overflow-hidden rounded-full border border-border p-0 hover:bg-muted"
            disabled={isUploading}
            aria-label="Profilfoto ändern"
            onClick={() => fileInputRef.current?.click()}
          >
            {showPhoto ? (
              <img
                src={photoUrl}
                alt="Profilfoto"
                className="h-full w-full object-cover"
                onError={() => setFailedPhotoUrl(photoUrl ?? null)}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                <UserRound className="h-6 w-6" aria-hidden />
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-4 w-4 text-white" aria-hidden />
            </span>
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setPendingFile(file);
              }
              event.currentTarget.value = '';
            }}
          />
        </div>
      </Items>

      {pendingFile && (
        <AvatarCropModal
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onSave={(file) => {
            setPendingFile(null);
            onUploadPhoto(file);
          }}
        />
      )}
    </>
  );
}
