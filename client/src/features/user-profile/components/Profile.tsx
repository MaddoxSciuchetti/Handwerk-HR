import ErrorAlert from '@/components/alerts/ErrorAlert';
import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import useAuth from '@/features/user-profile/hooks/useAuth';
import useUploadProfieImage from '../hooks/useUploadProfieImage';
import ProfileBio from './ProfileBio';
import ProfileHeader from './ProfileHeader';
import UploadImageForm from './UploadImageForm';
import VerificationCheck from './VerificationCheck';

const Profile = () => {
  const { user, isLoading, isError } = useAuth();
  const {
    handleBoxClick,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    fileInputRef,
    data,
    isPending,
  } = useUploadProfieImage();

  if (isLoading)
    return (
      <CenteredDiv>
        <LoadingAlert />
      </CenteredDiv>
    );

  if (isError || !user) {
    return <ErrorAlert />;
  }

  return (
    <div className="flex flex-col items-center mt-16 space-y-4 ">
      <ProfileHeader />
      <VerificationCheck user={user} />
      <UploadImageForm
        handleBoxClick={handleBoxClick}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        isPending={isPending}
        data={data}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
      />
      <ProfileBio user={user} />
    </div>
  );
};

export default Profile;
