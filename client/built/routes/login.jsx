// src/routes/login.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { LoginComponent } from "@/features/Login";
export const Route = createFileRoute("/login")({
    component: LoginForm,
});
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["female"] = "female";
    GenderEnum["male"] = "male";
    GenderEnum["other"] = "other";
})(GenderEnum || (GenderEnum = {}));
export default function LoginForm() {
    const { register, handleSubmit } = useForm();
    const onSubmit = (data) => console.log(data);
    return (<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginComponent />
      </div>
    </div>);
}
