import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useMutation } from "@tanstack/react-query";
import { signup } from "@/lib/api";

function ModalMitarbeiter() {
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");

    const {
        mutate: createEmployee,
        error,
        isPending,
        isError,
        isSuccess,
    } = useMutation({
        mutationFn: signup,
        onSuccess: () => console.log("success"),
        onError: () => {
            console.log(
                isError ? `this is error ${error.message}` : "nothing received",
            );
        },
    });

    if (isSuccess) return <div>Der Mitarbeiter wurde erstellt</div>;

    return (
        <>
            <div className="flex flex-col max-h-100 min-h-120 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-2xl">
                <div className="max-w-xl h-full w-xl my-10">
                    <p className="mb-5">
                        Ein Mitarbeiter erhält eine E-Mail mit der Bitte, sich
                        einzuloggen.
                    </p>
                    <div className="flex flex-col space-y-4">
                        <Input
                            id="firstname"
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        <Input
                            id="lastname"
                            type="text"
                            placeholder="Lastname"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                        <div className="space-y-2">
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                placeholder="email"
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                                className=""
                            />
                        </div>

                        <div className="space-y-2">
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                placeholder="password"
                                onChange={(e) => setPassword(e.target.value)}
                                className=""
                            />
                        </div>

                        <div className="space-y-2">
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                placeholder="Confirm Password
"
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                className=""
                            />
                        </div>

                        <Button
                            className="w-full my-2 "
                            variant={"outline"}
                            onClick={() =>
                                createEmployee({
                                    firstName,
                                    lastName,
                                    email,
                                    password,
                                    confirmPassword,
                                })
                            }
                        >
                            Nutzer Erstellen
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ModalMitarbeiter;
