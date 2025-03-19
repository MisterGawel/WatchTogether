'use client'

import React from "react";
import { Form, Input, Button, Link } from "@heroui/react";
import { auth } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ValidationError } from "next/dist/compiled/amphtml-validator";

interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
}

export default function RegisterPage() {
    const [dataForm, setDataForm] = React.useState<FormData>({
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errorMessage, setErrorMessage] = React.useState<ValidationError | null>(null);

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (dataForm.password !== dataForm.confirmPassword
            || dataForm.password.length < 6
            || dataForm.confirmPassword.length < 6) {
            setErrorMessage({ password: "Les mots de passe ne correspondent pas ou sont trop courts" });
            return;
        }

        createUserWithEmailAndPassword(auth, dataForm.email, dataForm.password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log(user);
            }
            ).catch((error) => {
                const errorMessage = error.message;
                console.log(errorMessage);

            }
            );
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center w-full h-full">
                <h1 className="text-4xl font-bold mb-16 text-blue-700">Inscription</h1>
                <Form className="w-full max-w-xs" onSubmit={onSubmit} validationErrors={errorMessage}>
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
                        validate={(value) => { if (value !== dataForm.confirmPassword) return "Les mots de passe ne correspondent pas"; return true; }}
                        className="pt-4"
                        placeholder="Entrez votre mot de passe"
                        type="password"
                    />
                    <Input
                        isRequired
                        errorMessage="Entrer un mot de passe valide"
                        label="Confirmation de mot de passe"
                        labelPlacement="outside"
                        name="password"
                        value={dataForm.confirmPassword}
                        onChange={(e) => setDataForm({ ...dataForm, confirmPassword: e.target.value })}
                        size="lg"
                        className="pt-4"
                        placeholder="Confirmez votre mot de passe"
                        type="password"
                    />
                    <Button type="submit" color="primary" className="w-full mt-4">
                        Se connecter
                    </Button>
                    <div className="flex justify-center w-full mt-16">
                        <Link href="/auth/login" className="text-sm mt-4 text-gray-700 w-fit">
                            Déjà un compte ? Connectez-vous
                        </Link>
                    </div>
                </Form>
            </div>
        </>
    );
}

