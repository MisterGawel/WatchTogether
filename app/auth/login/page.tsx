'use client'

import React from "react";
import { Form, Input, Button, Link } from "@heroui/react";

import { auth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

interface FormData {
    email: string;
    password: string;
}

export default function LoginPage() {
    const [dataForm, setDataForm] = React.useState<FormData>({
        email: "",
        password: "",
    });
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        signInWithEmailAndPassword(auth, dataForm.email, dataForm.password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log(user);

            }
            ).catch((error) => {
                const errorMessage = error.message;
                setErrorMessage(errorMessage);

            }
            );
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center w-full h-full">
                <h1 className="text-4xl font-bold mb-16 text-blue-700">Connexion</h1>
                <p className="text-red-500">{errorMessage}</p>
                <Form className="w-full max-w-xs" onSubmit={onSubmit}>
                    <Input
                        isRequired
                        errorMessage="Entrer un email valide"
                        label="Email"
                        labelPlacement="outside"
                        name="email"
                        value={dataForm.email}
                        onChange={(e) => setDataForm({ ...dataForm, email: e.target.value })}
                        size="lg"
                        placeholder="Entrez votre email"
                        type="email"
                    />
                    <Input
                        isRequired
                        errorMessage="Entrer un mot de passe valide"
                        label="Mot de passe"
                        labelPlacement="outside"
                        name="password"
                        value={dataForm.password}
                        onChange={(e) => setDataForm({ ...dataForm, password: e.target.value })}
                        size="lg"
                        className="pt-4"
                        placeholder="Entrez votre mot de passe"
                        type="password"
                    />
                    <Button type="submit" color="primary" className="w-full mt-4">
                        Se connecter
                    </Button>
                    <Link href="/auth/register" className="text-sm mt-4 text-gray-700 w-fit">
                        Pas encore de compte ? Créez-en un
                    </Link>
                </Form>
            </div>
        </>
    );
}

