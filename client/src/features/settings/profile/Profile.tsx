import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Table } from '@/components/ui/selfmade/table/Table';
import { User } from '@/features/user-profile/types/auth.type';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EditableTextRow } from './EditableTextRow';
import { ProfilePhotoRow } from './ProfilePhotoRow';
import { ProfileUpdateInput, profileUpdateSchema } from './profile.schemas';
import { useProfileSettings } from './useProfileSettings';

type EditableField = keyof ProfileUpdateInput;

function getInitialValues(user?: User): ProfileUpdateInput {
  return {
    displayName: user?.displayName || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  };
}

function Profile() {
  const {
    user,
    isLoading,
    isError,
    saveProfile,
    profilePhoto,
    uploadPhoto,
    isSaving,
    isUploadingPhoto,
  } = useProfileSettings();
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [values, setValues] = useState<ProfileUpdateInput>(getInitialValues());

  useEffect(() => {
    if (user && !editingField) {
      setValues(getInitialValues(user));
    }
  }, [user, editingField]);

  const trySaveField = (field: EditableField) => {
    if (!user) return;

    const nextValues = {
      ...values,
      [field]: values[field].trim(),
    };

    const parsed = profileUpdateSchema.safeParse(nextValues);
    if (!parsed.success) {
      const issue = parsed.error.issues.find(
        (entry) => entry.path[0] === field
      );
      toast.error(issue?.message || 'Ungültiger Wert.');
      setValues(getInitialValues(user));
      setEditingField(null);
      return;
    }

    const current = getInitialValues(user);
    const changed = Object.keys(current).some((key) => {
      const typedKey = key as EditableField;
      return current[typedKey] !== parsed.data[typedKey];
    });

    setEditingField(null);
    setValues(parsed.data);

    if (changed) {
      saveProfile(parsed.data);
    }
  };

  if (isLoading) return <LoadingAlert />;
  if (isError || !user) {
    return <div className="p-6">Profil konnte nicht geladen werden.</div>;
  }

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="flex w-200 flex-col items-start">
          <h1 className="typo-h4 font-bold">Profil</h1>
          <p className="typo-body-sm text-muted-foreground">
            Bearbeite deine persönlichen Kontodaten direkt in der Tabelle.
          </p>
        </div>
        <Table className="w-200">
          {/* <TableDivider /> */}

          <EditableTextRow
            label="Display Name"
            value={values.displayName}
            isEditing={editingField === 'displayName'}
            isDisabled={isSaving}
            onClickValue={() => setEditingField('displayName')}
            onChangeValue={(value) =>
              setValues((prev) => ({ ...prev, displayName: value }))
            }
            onBlur={() => trySaveField('displayName')}
          />
          <EditableTextRow
            label="Vorname"
            value={values.firstName}
            isEditing={editingField === 'firstName'}
            isDisabled={isSaving}
            onClickValue={() => setEditingField('firstName')}
            onChangeValue={(value) =>
              setValues((prev) => ({ ...prev, firstName: value }))
            }
            onBlur={() => trySaveField('firstName')}
          />
          <EditableTextRow
            label="Nachname"
            value={values.lastName}
            isEditing={editingField === 'lastName'}
            isDisabled={isSaving}
            onClickValue={() => setEditingField('lastName')}
            onChangeValue={(value) =>
              setValues((prev) => ({ ...prev, lastName: value }))
            }
            onBlur={() => trySaveField('lastName')}
          />
          <EditableTextRow
            label="Email Adresse"
            value={values.email}
            isEditing={editingField === 'email'}
            isDisabled={isSaving}
            onClickValue={() => setEditingField('email')}
            onChangeValue={(value) =>
              setValues((prev) => ({ ...prev, email: value }))
            }
            onBlur={() => trySaveField('email')}
          />
          <ProfilePhotoRow
            photoUrl={profilePhoto}
            isUploading={isUploadingPhoto}
            onUploadPhoto={uploadPhoto}
          />
        </Table>
      </div>
    </div>
  );
}

export default Profile;
