import { TeamsConnectionCard } from '@/features/microsoft-teams/TeamsConnectionCard';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody } from '@/components/ui/table';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { User } from '@/features/user-profile/types/auth.type';
import { useState } from 'react';
import { toast } from 'sonner';
import Employees from '@/features/settings/employees/Employees';
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
  const saved = getInitialValues(user);
  const [draft, setDraft] = useState<ProfileUpdateInput | null>(null);
  const values = draft ?? saved;

  const changeField = (field: EditableField, value: string) => {
    setDraft((current) => ({ ...(current ?? saved), [field]: value }));
  };

  const trySaveField = (field: EditableField) => {
    if (!user || !draft) return;

    const trimmed = values[field].trim();
    if (trimmed === saved[field]) {
      setDraft(null);
      return;
    }

    const parsedField = profileUpdateSchema.shape[field].safeParse(trimmed);
    if (!parsedField.success) {
      toast.error(parsedField.error.issues[0]?.message ?? 'Ungültiger Wert.');
      setDraft(null);
      return;
    }

    const parsed = profileUpdateSchema.safeParse({
      ...values,
      [field]: parsedField.data,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues.find(
        (entry) => entry.path[0] === field
      );
      toast.error(issue?.message || 'Ungültiger Wert.');
      setDraft(null);
      return;
    }

    const current = getInitialValues(user);
    const changed = Object.keys(current).some((key) => {
      const typedKey = key as EditableField;
      return current[typedKey] !== parsed.data[typedKey];
    });

    setDraft(null);

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
      <div className="flex h-full w-full flex-col items-stretch">
        <SettingsPageHeader title="Profil" />
        <Card className="mt-5 w-full gap-0 border border-border py-0 shadow-none ring-0">
          <CardContent className="px-2 py-2">
          <Table>
          <TableBody className="[&_tr]:border-0 [&_td]:px-2 [&_td]:py-4 [&_td:first-child]:pl-10">
          <EditableTextRow
            label="Display Name"
            value={values.displayName}
            isDisabled={isSaving}
            onChangeValue={(value) => changeField('displayName', value)}
            onBlur={() => trySaveField('displayName')}
          />
          <EditableTextRow
            label="Vorname"
            value={values.firstName}
            isDisabled={isSaving}
            onChangeValue={(value) => changeField('firstName', value)}
            onBlur={() => trySaveField('firstName')}
          />
          <EditableTextRow
            label="Nachname"
            value={values.lastName}
            isDisabled={isSaving}
            onChangeValue={(value) => changeField('lastName', value)}
            onBlur={() => trySaveField('lastName')}
          />
          <EditableTextRow
            label="Email Adresse"
            type="email"
            value={values.email}
            isDisabled={isSaving}
            onChangeValue={(value) => changeField('email', value)}
            onBlur={() => trySaveField('email')}
          />
          <ProfilePhotoRow
            photoUrl={profilePhoto}
            isUploading={isUploadingPhoto}
            onUploadPhoto={uploadPhoto}
          />
          </TableBody>
          </Table>
          </CardContent>
        </Card>
        <TeamsConnectionCard user={user} />
        <Employees />
      </div>
    </div>
  );
}

export default Profile;
