'use client';

import React from 'react';
import { Form, Input, Button, Link } from '@heroui/react';
import { auth, db } from '@/app/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ValidationError } from 'next/dist/compiled/amphtml-validator';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface FormData {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
}

export default function RegisterPage() {
	const [dataForm, setDataForm] = React.useState<FormData>({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	});
	const router = useRouter();
	const [errorMessage, setErrorMessage] =
		React.useState<ValidationError | null>(null);

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (dataForm.password !== dataForm.confirmPassword) {
			setErrorMessage('Les mots de passe ne correspondent pas');
			return;
		}

		try {
			const { user } = await createUserWithEmailAndPassword(
				auth,
				dataForm.email,
				dataForm.password
			);

			await setDoc(doc(db, 'users', user.uid), {
				email: user.email,
				name: dataForm.name,
				communities: {},
				rooms: [],
			});

			router.push('/');
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<>
			<div className="flex flex-col items-center justify-center w-full h-full">
				<h1 className="mb-16 text-3xl font-bold text-foreground">
					Inscription
				</h1>
				<Form
					className="w-full max-w-xs"
					onSubmit={onSubmit}
					validationErrors={errorMessage}
				>
					<p className="mx-auto mb-6 text-sm text-red-500">
						{errorMessage}
					</p>
					<Input
						isRequired
						errorMessage="Entrer un nom valide"
						label="Nom"
						labelPlacement="outside"
						name="name"
						classNames={{
							input: 'placeholder:text-sm',
						}}
						value={dataForm.name}
						onChange={(e) =>
							setDataForm({ ...dataForm, name: e.target.value })
						}
						size="lg"
						placeholder="Entrez votre nom"
						type="text"
					/>
					<Input
						isRequired
						errorMessage="Entrer un email valide"
						label="Email"
						labelPlacement="outside"
						name="email"
						classNames={{
							input: 'placeholder:text-sm',
						}}
						value={dataForm.email}
						onChange={(e) =>
							setDataForm({ ...dataForm, email: e.target.value })
						}
						size="lg"
						className="pt-4"
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
					<Input
						isRequired
						errorMessage="Entrer un mot de passe valide"
						label="Confirmation de mot de passe"
						labelPlacement="outside"
						name="password"
						classNames={{
							input: 'placeholder:text-sm',
						}}
						value={dataForm.confirmPassword}
						onChange={(e) =>
							setDataForm({
								...dataForm,
								confirmPassword: e.target.value,
							})
						}
						size="lg"
						className="pt-4"
						placeholder="Confirmez votre mot de passe"
						type="password"
					/>
					<Button
						type="submit"
						color="primary"
						className="px-10 mx-auto mt-4 w-fit"
					>
						S&apos;inscrire
					</Button>
					<div className="flex justify-center w-full mt-4">
						<Link
							href="/auth/login"
							className="mt-4 text-sm text-gray-700 w-fit"
						>
							Déjà un compte ? Connectez-vous
						</Link>
					</div>
				</Form>
			</div>
		</>
	);
}
