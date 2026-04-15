import { AvatarCropModal } from '@/features/sidebar/profile-upload-modal/AvatarCropModal';
import { Input } from '@/components/ui/input';
import { GrowingItem, Items } from '@/components/ui/selfmade/table/Table';
import { Camera } from 'lucide-react';
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
  const fallbackPhoto =
    'https://thumbs.dreamstime.com/b/default-profile-picture-avatar-photo-placeholder-vector-illustration-default-profile-picture-avatar-photo-placeholder-vector-189495158.jpg';

  return (
    <>
      <Items state="default" className="px-3 py-1">
        <GrowingItem>
          <p className="typo-body-sm">Profil Foto</p>
        </GrowingItem>
        <div className="w-72">
          <button
            type="button"
            className="group relative h-16 w-16 overflow-hidden rounded-full border border-border-default"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <img
              src={photoUrl || fallbackPhoto}
              alt="Profil Foto"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-4 w-4 text-white" />
            </span>
          </button>
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
