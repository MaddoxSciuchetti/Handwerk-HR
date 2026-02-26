type ProfileBioProps = {
  createdAt: Date;
};

const ProfileBio = ({ createdAt }: ProfileBioProps) => {
  return (
    <>
      <p>Klicke auf das foto um ein neues hochzuladen</p>
      <p className="text-black">
        Erstellt am{' '}
        <span className="text-black">
          {new Date(createdAt).toLocaleDateString('en-US')}
        </span>
      </p>
    </>
  );
};

export default ProfileBio;
