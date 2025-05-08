'use client';
import { BsArrowRight } from 'react-icons/bs';
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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { Button } from '@heroui/button';
import { useRouter } from 'next/navigation';
import { BsFillCameraVideoFill } from 'react-icons/bs';
import { MdDelete } from 'react-icons/md';
import { BsFillMegaphoneFill } from 'react-icons/bs';
import Link from 'next/link';
import { Tabs, Tab } from '@heroui/tabs';

export default function RoomPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: roomId } = use(params);
	const searchParams = useSearchParams();

	const [currentUser, setCurrentUser] = useState<any>(null);
	const [isAdmin, setIsAdmin] = useState<boolean>(false);
	const router = useRouter();

	// On vérifie que la salle existe sinon on redirige vers la page d'accueil et on affiche une alerte
	useEffect(() => {
		if (!roomId) return;
		const checkRoomExists = async () => {
			try {
				const roomRef = doc(db, 'rooms', roomId);
				const roomSnap = await getDoc(roomRef);
				if (!roomSnap.exists()) {
					router.push('/?error=room-not-found');
				}
			} catch (err) {
				console.error('Erreur vérification salle:', err);
				// En cas d'erreur, rediriger vers la page d'accueil
				router.push('/');
			}
		};
		checkRoomExists();
	}, [roomId, router]);

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

	// Vérification si l'utilisateur est admin de la salle
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
	//Code pour le nombre de perssone dans la room (ALEXIS)
	useEffect(() => {
		if (!currentUser || !roomId) return;

		const interval = setInterval(() => {
			setDoc(doc(db, 'presence', currentUser.uid), {
				userId: currentUser.uid,
				roomId: roomId,
				lastSeen: Date.now(),
			});
		}, 10000); // ping toutes les 10s

		return () => clearInterval(interval);
	}, [currentUser, roomId]);
	if (!currentUser) {
		return (
			<div className="flex items-center justify-center h-screen bg-gray-100">
				<p className="text-gray-500">Connexion en cours...</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full min-h-screen gap-4 p-4 lg:flex-row">
			{/* Colonne vidéo principale */}
			<div className="flex flex-col w-full gap-4 lg:w-3/5">
				<div className="flex flex-col w-full h-full gap-4 px-4 py-4 bg-foreground-50 rounded-xl">
					<SearchBar
						// @ts-expect-error blabla
						onSelect={async (video) => {
							await fetch(`/api/rooms/${roomId}/add-video`, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									url: video.url,
									user: currentUser.name || 'anonymous',
									title: video.title,
									thumbnail: video.thumbnail,
								}),
							});
						}}
					/>

					<SyncedVideoPlayer
						roomId={roomId}
						userId={currentUser.uid}
						isAdmin={isAdmin}
					/>
					<Divider className="mt-2 bg-background" />
					<Tabs
						isVertical
						classNames={{
							base: 'flex flex-col gap-4 group-data-[selected=true]:bg-muted data-[selected=true]:text-foreground',
							tab: 'flex flex-col items-center justify-center w-full h-full px-8 py-2 text-sm font-medium text-left transition-colors rounded-lg cursor-pointer hover:bg-muted group-data-[selected=true]:bg-muted data-[selected=true]:text-foreground',
							cursor: 'bg-foreground-50 text-foreground font-bold ',
						}}
					>
						<Tab key={'Historique'} title="Historique">
							<VideoHistory roomId={roomId} />
						</Tab>
						<Tab key={'File d’attente'} title="File d’attente">
							<VideoQueue
								roomId={roomId}
								currentUserId={currentUser.uid}
								isAdmin={isAdmin}
							/>
						</Tab>
					</Tabs>
				</div>
			</div>

			{/* Colonne chat */}
			<div className="flex flex-col w-full lg:w-2/5">
				<div className="flex flex-col w-full h-full gap-4 px-4 py-4 bg-foreground-50 rounded-xl">
					<Card className="w-full bg-transparent shadow-none">
						<CardHeader className="relative flex items-center justify-end px-0 pt-0 pb-2">
							<Button
								color="danger"
								size="md"
								as={Link}
								endContent={<BsArrowRight />}
								href={`/`}
							>
								Quitter la salle
							</Button>
						</CardHeader>
					</Card>
					<ChatRoomSocket
						roomId={roomId}
						username={currentUser.name || 'anonymous'}
					/>
				</div>
			</div>
		</div>
	);
}
