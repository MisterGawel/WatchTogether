'use client';

import React from 'react';
import { Form, Input, Button, Link } from '@heroui/react';
import { auth } from '@/app/firebase';
import {
	signInWithEmailAndPassword,
	setPersistence,
	browserLocalPersistence,
} from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

interface FormData {
	email: string;
	password: string;
}

export default function LoginPage() {
	const [loading, setLoading] = React.useState<boolean>(false);
	const [dataForm, setDataForm] = React.useState<FormData>({
		email: '',
		password: '',
	});
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		try {
			await setPersistence(auth, browserLocalPersistence);
			const userCredential = await signInWithEmailAndPassword(
				auth,
				dataForm.email,
				dataForm.password
			);
			console.log(userCredential.user);
		} catch (error) {
			if (error instanceof Error) {
				setErrorMessage(error.message);
			} else {
				setErrorMessage('Une erreur est survenue');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div className="flex flex-col items-center justify-center w-full h-full">
				<h1 className="mb-16 text-3xl font-bold text-foreground">
					Connexion
				</h1>
				<p className="text-red-500">{errorMessage}</p>
				<Form className="w-full max-w-xs" onSubmit={onSubmit}>
					<Input
						isRequired
						errorMessage="Entrer un email valide"
						label="Email"
						labelPlacement="outside"
						name="email"
						value={dataForm.email}
						classNames={{
							input: 'placeholder:text-sm',
						}}
						onChange={(e) =>
							setDataForm({ ...dataForm, email: e.target.value })
						}
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
						classNames={{
							input: 'placeholder:text-sm',
						}}
						value={dataForm.password}
						onChange={(e) =>
							setDataForm({
								...dataForm,
								password: e.target.value,
							})
						}
						size="lg"
						className="pt-4"
						placeholder="Entrez votre mot de passe"
						type="password"
					/>
					<Button
						type="submit"
						color="primary"
						className="px-10 mx-auto mt-4 w-fit"
						isLoading={loading}
					>
						Se connecter
					</Button>
					<Link
						href="/auth/register"
						className="mx-auto mt-4 text-sm text-foreground w-fit"
					>
						Pas encore de compte ? Créez-en un
					</Link>
				</Form>
			</div>
		</>
	);
}
