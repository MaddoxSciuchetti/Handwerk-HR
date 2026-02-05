import useAuth from "@/hooks/useAuth";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Profile = () => {
  const { user, isLoading, isError } = useAuth();
  console.log("this should be the email", user?.email);

  if (isLoading) {
    return (
      <div className="flex justify-center mt-16">
        <h1 className="text-3xl font-bold">Loading user data</h1>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center mt-16 space-y-2">
        <h1 className="text-3xl font-bold">Error loading user</h1>
        <p className="text-red-500">Please try again later</p>
      </div>
    );
  }

  const { email, verified, createdAt } = user;

  return (
    <div className="flex flex-col items-center mt-16 space-y-4">
      <h1 className="text-3xl font-bold mb-4">My Account</h1>
      {!verified && (
        <Alert
          variant="default"
          className="w-fit rounded-xl mb-3 border-yellow-200 bg-yellow-50"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Please verify your email
          </AlertDescription>
        </Alert>
      )}
      <p className="text-black mb-2">
        Email: <span className="text-black">{email}</span>
      </p>
      <p className="text-black">
        Created on{" "}
        <span className="text-black">
          {new Date(createdAt).toLocaleDateString("en-US")}
        </span>
      </p>
    </div>
  );
};

export default Profile;
