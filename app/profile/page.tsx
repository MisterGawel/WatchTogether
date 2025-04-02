'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { User } from 'firebase/auth';

export default function Profile() {
	const [user, setUser] = useState<User | null>();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [rooms, setRooms] = useState<string[]>([]);

	// Récupérer les données de l'utilisateur
	useEffect(() => {
		if (auth.currentUser) {
			const userData = auth.currentUser;
			setUser(userData);
			setEmail(userData.email || '');
			// Simuler la récupération des rooms créées par l'utilisateur
			setRooms(['Room 1', 'Room 2', 'Room 3']); // À remplacer par l'appel à votre API de rooms
		}
	}, []);

	// Fonction pour changer l'email
	const handleChangeEmail = async () => {
		if (user) {
			try {
				/*                 await user.updateEmail(email); */
				alert('Email mis à jour !');
			} catch (error) {
				console.error(
					"Erreur lors de la mise à jour de l'email:",
					error
				);
				alert("Erreur lors de la mise à jour de l'email.");
			}
		}
	};

	// Fonction pour changer le mot de passe
	const handleChangePassword = async () => {
		if (user) {
			try {
				/*                 await user.updatePassword(password);
				 */ alert('Mot de passe mis à jour !');
			} catch (error) {
				console.error(
					'Erreur lors de la mise à jour du mot de passe:',
					error
				);
				alert('Erreur lors de la mise à jour du mot de passe.');
			}
		}
	};

	// Fonction pour supprimer le compte
	const handleDeleteAccount = async () => {
		if (user) {
			try {
				await user.delete();
				alert('Compte supprimé avec succès !');
				signOut(auth); // Déconnecter l'utilisateur après suppression
			} catch (error) {
				console.error(
					'Erreur lors de la suppression du compte:',
					error
				);
				alert('Erreur lors de la suppression du compte.');
			}
		}
	};

	return (
		<div className="w-screen h-screen p-6 mx-auto text-black bg-blue-100">
			<div className="flex flex-col max-w-[30rem] mx-auto">
				<h1 className="mb-6 text-3xl font-semibold text-center">
					Mon Profil
				</h1>
				<div className="space-y-4">
					{/* Informations personnelles */}
					{user && (
						<div className="p-4 bg-white rounded-lg shadow-sm">
							<h2 className="text-xl font-semibold">
								Informations personnelles
							</h2>
							<p>
								<strong>Nom : </strong>
								{user.displayName}
							</p>
							<p>
								<strong>Email : </strong>
								{email}
							</p>
							<p>
								<strong>Mot de passe : </strong>*******
							</p>
						</div>
					)}
					{/* Modifier l'email */}
					<div className="p-4 bg-white rounded-lg shadow-sm">
						<h2 className="text-xl font-semibold">
							Changer d'email
						</h2>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full p-2 mb-4 border rounded-lg"
							placeholder="Entrez un nouvel email"
						/>
						<button
							onClick={handleChangeEmail}
							className="w-full p-2 text-white bg-blue-500 rounded-lg"
						>
							Changer l'email
						</button>
					</div>
					{/* Modifier le mot de passe */}
					<div className="p-4 bg-white rounded-lg shadow-sm">
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
						<button
							onClick={handleChangePassword}
							className="w-full p-2 text-white bg-blue-500 rounded-lg"
						>
							Changer le mot de passe
						</button>
					</div>
					{/* Bouton de suppression du compte */}
					<div className="p-4 bg-white rounded-lg shadow-sm">
						<h2 className="text-xl font-semibold">
							Supprimer mon compte
						</h2>
						<button
							onClick={handleDeleteAccount}
							className="flex items-center justify-center w-full gap-2 p-2 text-white bg-red-500 rounded-lg"
						>
							Supprimer le compte
						</button>
					</div>
					{/* Déconnexion */}
					<div className="p-4 bg-white rounded-lg shadow-sm">
						<button
							onClick={() => signOut(auth)}
							className="flex items-center justify-center w-full gap-2 p-2 text-white bg-gray-500 rounded-lg"
						>
							Déconnexion
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
