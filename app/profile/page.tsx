'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/app/firebase';
import {
	signOut,
	onAuthStateChanged,
	updateEmail as fbUpdateEmail,
	updatePassword as fbUpdatePassword,
	deleteUser as fbDeleteUser,
	User,
} from 'firebase/auth';
import { Button } from '@heroui/button';
import Link from 'next/link';

export default function Profile() {
	const [user, setUser] = useState<User | null>(null);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	// Écouteur d'auth state
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (u) => {
			setUser(u);
			if (u?.email) setEmail(u.email);
		});
		return () => unsubscribe();
	}, []);

	const handleChangeEmail = async () => {
		if (!user) return;
		try {
			await fbUpdateEmail(user, email);
			alert('Email mis à jour !');
		} catch (error) {
			console.error("Erreur lors de la mise à jour de l'email:", error);
			alert("Erreur lors de la mise à jour de l'email.");
		}
	};

	const handleChangePassword = async () => {
		if (!user) return;
		try {
			await fbUpdatePassword(user, password);
			alert('Mot de passe mis à jour !');
		} catch (error) {
			console.error(
				'Erreur lors de la mise à jour du mot de passe:',
				error
			);
			alert('Erreur lors de la mise à jour du mot de passe.');
		}
	};

	const handleDeleteAccount = async () => {
		if (!user) return;
		try {
			await fbDeleteUser(user);
			alert('Compte supprimé avec succès !');
			await signOut(auth);
		} catch (error) {
			console.error('Erreur lors de la suppression du compte:', error);
			alert('Erreur lors de la suppression du compte.');
		}
	};

	if (user === null) {
		return <p>Chargement de votre profil...</p>;
	}

	return (
		<div className="w-screen h-screen p-6 mx-auto text-foreground">
			<Button
				className="absolute top-4 left-4"
				color="primary"
				size="sm"
				href="/"
				as={Link}
			>
				Retour à l&apos;accueil
			</Button>
			<div className="flex flex-col max-w-[30rem] mx-auto">
				<h1 className="mb-6 text-3xl font-semibold text-center">
					Mon Profil
				</h1>
				<div className="space-y-4">
					{/* Informations personnelles */}
					<div className="p-4 rounded-lg shadow-sm bg-content1">
						<h2 className="text-xl font-semibold">
							Informations personnelles
						</h2>
						<p>
							<strong>Nom : </strong>
							{user.displayName || '—'}
						</p>
						<p>
							<strong>Email : </strong>
							{email}
						</p>
						<p>
							<strong>Mot de passe : </strong>********
						</p>
					</div>

					{/* Modifier l'email */}
					<div className="p-4 rounded-lg shadow-sm bg-content1">
						<h2 className="text-xl font-semibold">
							Changer d&apos;email
						</h2>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full p-2 mb-4 border rounded-lg"
							placeholder="Entrez un nouvel email"
						/>
						<Button
							color="primary"
							onPress={handleChangeEmail}
							className="w-full p-2 rounded-lg"
						>
							Changer l&apos;email
						</Button>
					</div>

					{/* Modifier le mot de passe */}
					<div className="p-4 rounded-lg shadow-sm bg-content1">
						<h2 className="text-xl font-semibold">
							Changer de mot de passe
						</h2>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full p-2 mb-4 border rounded-lg"
							placeholder="Entrez un nouveau mot de passe"
						/>
						<Button
							color="primary"
							onPress={handleChangePassword}
							className="w-full p-2 rounded-lg "
						>
							Changer le mot de passe
						</Button>
					</div>

					{/* Supprimer le compte */}
					<div className="p-4 rounded-lg shadow-sm bg-content1">
						<h2 className="text-xl font-semibold">
							Supprimer mon compte
						</h2>
						<Button
							onPress={handleDeleteAccount}
							color="danger"
							className="w-full p-2 bg-red-500 rounded-lg text-content1"
						>
							Supprimer le compte
						</Button>
					</div>

					{/* Déconnexion */}
					<div className="p-4 rounded-lg shadow-sm bg-content1">
						<Button
							color="primary"
							onPress={() => signOut(auth)}
							className="w-full p-2 rounded-lg"
						>
							Déconnexion
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
