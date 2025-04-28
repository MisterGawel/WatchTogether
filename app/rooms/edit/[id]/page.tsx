'use client';

import { useEffect, useState } from 'react';
import { db } from '@/app/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function RoomPage({ params }: { params: Promise<any> }) {
	const [roomData, setRoomData] = useState<{
		name: string;
		community: string;
		admin: string;
	} | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [resolvedParams, setResolvedParams] = useState<any>(null);
	const router = useRouter();

	useEffect(() => {
		const fetchRoomData = async () => {
			try {
				const resolved = await params;
				setResolvedParams(resolved);

				const roomId = resolved?.id;
				if (!roomId) {
					console.error('Room ID is missing');
					return;
				}

				const roomRef = doc(db, 'rooms', roomId);
				const roomSnapshot = await getDoc(roomRef);

				if (roomSnapshot.exists()) {
					const data = roomSnapshot.data();
					setRoomData({
						name: data?.name || 'No name available',
						community: data?.community || 'No community ID',
						admin: data?.admin || 'No admin ID',
					});
				} else {
					console.error('Room not found');
				}
			} catch (error) {
				console.error('Error fetching room:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchRoomData();
	}, [params]);

	const handleCopyLink = () => {
		if (resolvedParams?.id) {
			const roomLink = `${window.location.origin}/rooms/new/${resolvedParams.id}`;
			navigator.clipboard
				.writeText(roomLink)
				.then(() => alert('Lien copié !'))
				.catch((error) => console.error('Copy failed:', error));
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
				<div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
			</div>
		);
	}

	// Vérifie si l'utilisateur courant est l'admin
	const isAdmin = roomData?.admin === 'currentUserId'; // Remplacez 'currentUserId' par l'ID de l'utilisateur courant

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
			<div className="p-6 space-y-4 bg-white rounded-lg shadow-lg dark:bg-gray-800 w-96">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
					{roomData?.name || 'Unknown Room'}
				</h1>

				{/* Affichage des IDs */}
				<div className="space-y-2 text-sm">
					<p className="text-gray-600 dark:text-gray-300">
						<span className="font-semibold">Community ID:</span>{' '}
						{roomData?.community}
					</p>
					<p className="text-gray-600 dark:text-gray-300">
						<span className="font-semibold">Admin ID:</span>{' '}
						{roomData?.admin}
					</p>
				</div>

				{/* Bouton Modifier (visible seulement pour l'admin) */}
				{isAdmin && (
					<button
						onClick={() =>
							router.push(`/rooms/edit/${resolvedParams.id}`)
						}
						className="w-full py-2 text-white transition bg-green-500 rounded-md hover:bg-green-600"
					>
						Modifier la Room
					</button>
				)}

				{/* Bouton de copie */}
				<button
					onClick={handleCopyLink}
					className="w-full py-2 mt-4 text-white transition bg-blue-500 rounded-md hover:bg-blue-600"
				>
					Copy Room Link
				</button>
			</div>
		</div>
	);
}
