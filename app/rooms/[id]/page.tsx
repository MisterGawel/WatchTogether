'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SyncedVideoPlayer from '@/components/room/SyncedVideoPlayer';
import VideoQueue from '@/components/room/VideoQueue';
import VideoHistory from '@/components/room/VideoHistory';
import ChatRoomSocket from '@/components/room/ChatRoomSocket';
import SearchBar from '@/components/room/SearchBar';
import { auth, db } from '@/app/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function RoomPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: roomId } = use(params);
	const searchParams = useSearchParams();

	const [currentUser, setCurrentUser] = useState<any>(null);
	const [isAdmin, setIsAdmin] = useState<boolean>(false);

	// Vérification de l'état de connexion de l'utilisateur
	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async (user) => {
			if (user) {
				// Utilisateur connecté : récupérer "name" depuis Firestore
				const userDoc = await getDoc(doc(db, 'users', user.uid));
				const userData = userDoc.exists() ? userDoc.data() : {};
				setCurrentUser({
					uid: user.uid,
					name: userData.name || 'anonymous',
				});
			} else {
				// Utilisateur non connecté (invité)
				const anonName = `invité-${Math.floor(Math.random() * 1000)}`;
				setCurrentUser({
					uid: 'anonymous',
					name: anonName,
				});
			}
		});
		return () => unsub();
	}, []);

	useEffect(() => {
		if (!currentUser || !roomId) return;

		const checkAdmin = async () => {
			try {
				const roomRef = doc(db, 'rooms', roomId);
				const snap = await getDoc(roomRef);
				if (snap.exists()) {
					const data = snap.data();
					setIsAdmin(data.admin === currentUser.uid);
				}
			} catch (err) {
				console.error('Erreur vérification admin:', err);
			}
		};

		checkAdmin();
	}, [currentUser, roomId]);

	if (!currentUser) {
		return (
			<div className="flex items-center justify-center h-screen bg-gray-100">
				<p className="text-gray-500">Connexion en cours...</p>
			</div>
		);
	}

	return (
		<div className="grid min-h-screen grid-cols-1 gap-4 p-4 bg-gray-100 lg:grid-cols-5 dark:bg-gray-900">
			{/* Colonne vidéo principale */}
			<div className="space-y-4 lg:col-span-3">
				<SyncedVideoPlayer
					roomId={roomId}
					userId={currentUser.uid}
					isAdmin={isAdmin}
				/>

				<SearchBar
					onSelect={async (video: { url: string }) => {
						await fetch(`/api/rooms/${roomId}/add-video`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								url: video.url,
								user: currentUser.name || 'anonymous',
							}),
						});
					}}
				/>

				<VideoQueue
					roomId={roomId}
					currentUserId={currentUser.uid}
					isAdmin={isAdmin}
				/>
				<VideoHistory roomId={roomId} />
			</div>

			{/* Colonne chat */}
			<div className="flex flex-col lg:col-span-2">
				<ChatRoomSocket
					roomId={roomId}
					username={currentUser.name || 'anonymous'}
				/>
			</div>
		</div>
	);
}
