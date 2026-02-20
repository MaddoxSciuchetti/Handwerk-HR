// src/routes/login.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useForm, SubmitHandler } from "react-hook-form";
import { LoginComponent } from "@/features/Login";

export const Route = createFileRoute("/login")({
    component: LoginForm,
});

export default function LoginForm() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <LoginComponent />
            </div>
        </div>
    );
}
