'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/app/firebase'; // 🔥 Import Firestore et auth
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { createRoom } from './roomService';

export default function Page() {
	const [roomName, setRoomName] = useState('');
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	// Gestion de l'authentification
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setCurrentUser(user);
			setLoading(false);

			// Rediriger si non connecté
			if (!user) {
				router.push('/login'); // Adaptez cette route selon votre configuration
			}
		});

		return () => unsubscribe();
	}, [router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!currentUser) {
			alert('Vous devez être connecté pour créer une room');
			return;
		}

		try {
			const communityID = 'UIyd1HlGNJACSPUNP2pl'; // Vous pourriez aussi rendre ceci dynamique
			const roomId = await createRoom(
				roomName,
				communityID,
				currentUser.uid
			);
			router.push(`/rooms/new/${roomId}`);
		} catch (error) {
			console.error('Erreur lors de la création de la room:', error);
			alert('Une erreur est survenue lors de la création de la room');
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
				<div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
			<form
				onSubmit={handleSubmit}
				className="p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 w-96"
			>
				<h1 className="mb-4 text-xl font-bold text-center text-gray-700 dark:text-gray-300">
					Créer une nouvelle Room
				</h1>

				{currentUser && (
					<p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
						Connecté en tant que:{' '}
						{currentUser.email || currentUser.uid}
					</p>
				)}

				<label
					htmlFor="input"
					className="block mb-2 text-lg font-medium text-gray-700 dark:text-gray-300"
				>
					Nom de la Room:
				</label>
				<input
					id="input"
					type="text"
					value={roomName}
					onChange={(e) => setRoomName(e.target.value)}
					className="w-full p-2 text-black bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white dark:bg-gray-700"
					placeholder="Entrez le nom de la room"
					required
				/>

				<button
					type="submit"
					className="w-full py-2 mt-4 text-white transition bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={!currentUser}
				>
					Créer la Room
				</button>

				{!currentUser && (
					<p className="mt-2 text-sm text-red-500">
						Vous devez être connecté pour créer une room
					</p>
				)}
			</form>
		</div>
	);
}
