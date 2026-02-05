import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ResetPassword = () => {
  const navigate = useNavigate();
  const search: any = useSearch({ from: "/password/reset" });

  const code = search.code as string | undefined;
  const exp = search.exp ? Number(search.exp) : undefined;
  console.log("this is the code", code);
  console.log("this is the exp", exp);

  console.log(code);

  const now = Date.now();
  const linkIsValid = code && exp && exp > now;
  return (
    <div className="min-h-screen flex justify-center">
      <div className="mx-auto max-w-md py-12 px-6 text-center">
        {linkIsValid ? (
          <ResetPasswordForm code={code} />
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Alert variant="destructive" className="w-fit rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Invalid Link</AlertDescription>
            </Alert>
            <p className="text-gray-400">
              The link is either invalid or expired.
            </p>
            <button
              onClick={() => navigate({ to: "/password/forgot" })}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Request a new password reset link
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { ResetPassword };
