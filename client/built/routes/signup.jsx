import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { SignupForm } from "@/features/Register";
export const Route = createFileRoute("/signup")({
    component: Signup,
});
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["female"] = "female";
    GenderEnum["male"] = "male";
    GenderEnum["other"] = "other";
})(GenderEnum || (GenderEnum = {}));
export default function Signup() {
    const { register, handleSubmit } = useForm();
    const onSubmit = (data) => console.log(data);
    return (<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>);
}
