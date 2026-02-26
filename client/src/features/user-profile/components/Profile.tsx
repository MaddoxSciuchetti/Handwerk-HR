import { useQuery } from '@tanstack/react-query';
import useUploadProfieImage from '../hooks/use-uploadProfileImage';
import useAuth from '@/features/user-profile/hooks/use-Auth';
import { getProfileFoto } from '../api';
import VerificationCheck from './VerificationCheck';
import UploadImageForm from './UploadImageForm';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import ErrorAlert from '@/components/alerts/ErrorAlert';
import ProfileBio from './ProfileBio';
import ProfileHeader from './ProfileHeader';

const Profile = () => {
  const { user, isLoading, isError } = useAuth();
  const {
    handleBoxClick,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    fileInputRef,
  } = useUploadProfieImage();

  const { data, isPending } = useQuery<string>({
    queryKey: ['profilepic'],
    queryFn: getProfileFoto,
  });

  if (isLoading) {
    return <LoadingAlert />;
  }
  if (isError || !user) {
    return <ErrorAlert />;
  }

  const { email, verified, createdAt } = user;

  return (
    <div className="flex flex-col items-center mt-16 space-y-4 ">
      <ProfileHeader />
      <VerificationCheck verified={verified} email={email} />
      <UploadImageForm
        handleBoxClick={handleBoxClick}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        isPending={isPending}
        data={data}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
      />
      <ProfileBio createdAt={createdAt} />
    </div>
  );
};

export default Profile;
