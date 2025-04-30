'use client';
import { useState, useEffect } from 'react';
import ChatCommu from './Chat';
import { BsFillMegaphoneFill } from 'react-icons/bs';
import { Card, CardHeader, Link } from '@heroui/react';
import { Button } from '@heroui/button';
import { db, auth } from '@/app/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { BsFillCameraVideoFill } from 'react-icons/bs';
import { onSnapshot, getDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import CardRoom from './Room';
import CardAnnonce from './Announce';
import CommunityMembers from './Member';
import { MdDelete } from 'react-icons/md';
interface Room {
	admin: string;
	community: string;
	createdAt: string;
	name: string;
	id: string;
}

export default function CommunitySpace({
	communityId,
}: {
	communityId: string;
}) {
	const [rooms, setRoom] = useState<Room[]>([]);
	const [communityName, setCommunityName] = useState('');
	const [annonces, setAnnonces] = useState([]);
	const [communities, setCommunities] = useState<Record<string, string>>({});

	const DonnéesBase = async () => {
		try {
			const communitiesRef = doc(db, 'communities', communityId);

			onSnapshot(communitiesRef, async (communityDocSnapshot) => {
				if (communityDocSnapshot.exists()) {
					const data = communityDocSnapshot.data();

					setCommunityName(data.name);

					const roomsId = data.rooms || [];

					// Charge les rooms
					const roomPromises = roomsId.map(async (roomId: string) => {
						const roomRef = doc(db, 'rooms', roomId);
						const roomSnapshot = await getDoc(roomRef);
						return roomSnapshot.exists()
							? { id: roomId, ...roomSnapshot.data() }
							: null;
					});
					const rooms = (await Promise.all(roomPromises)).filter(
						(room) => room !== null
					);
					setRoom(rooms);

					// Charge les annonces
					const announcements = data.announcements || [];
					setAnnonces(announcements);
				} else {
					console.log("Le document de la communauté n'existe pas !");
				}
			});
		} catch (error) {
			console.error(
				'Erreur lors de la récupération des données :',
				error
			);
		}
	};
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			if (currentUser) {
				const docRef = doc(db, 'users', currentUser.uid);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					const data = docSnap.data();
					setCommunities(data.communities || {});
				}
			} else {
				setCommunities({});
			}
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		DonnéesBase();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const isAdmin = (communityId: string): boolean => {
		return communities[communityId] === 'admin';
	};

	let role = 'member';
	if (isAdmin(communityId)) {
		role = 'admin';
	}

	const router = useRouter();
	return (
		<div className="flex flex-col min-h-full p-8">
			<div className="flex justify-between gap-8 ">
				<Card className="w-full py-2 border-2 border-muted">
					<CardHeader className="relative flex items-center justify-center">
						<Button
							color="primary"
							size="md"
							as={Link}
							className="absolute left-4"
							href={`/communities`}
						>
							Retour aux communautés
						</Button>
						<h1 className="text-xl font-bold">{communityName}</h1>
						<div className="absolute flex gap-2 right-4">
							{role === 'admin' && (
								<>
									<Button
										color="primary"
										isIconOnly
										size="md"
										onPress={() => {
											router.push(
												`/communities/${communityId}/create-announce`
											);
										}}
									>
										<BsFillMegaphoneFill />
									</Button>
									<Button
										color="primary"
										isIconOnly
										size="md"
										onPress={() => {
											router.push(
												`/communities/${communityId}/create-room`
											);
										}}
									>
										<BsFillCameraVideoFill />
									</Button>
									<Button
										color="danger"
										isIconOnly
										size="md"
										onPress={() => {
											router.push(
												`/communities/${communityId}/delete-community`
											);
										}}
									>
										<MdDelete className="text-xl" />
									</Button>
								</>
							)}
						</div>
					</CardHeader>
				</Card>
			</div>
			<div className="flex flex-grow gap-4 mt-6">
				<div className="flex flex-col w-[40%] gap-6 overflow-y-auto shadow-sm rounded-xl">
					<div className="w-full p-6 overflow-y-auto border-2 shadow-sm bg-content1 border-muted rounded-xl">
						<h2 className="mb-4 text-xl font-bold">
							Annonces de la communauté
						</h2>
						{annonces.map((annonce, index) => (
							<CardAnnonce
								key={index}
								announce={annonce}
								communityId={communityId}
								role={role}
								index={index}
							/>
						))}
					</div>
					<div className="w-full p-6 overflow-y-auto border-2 shadow-sm bg-content1 border-muted rounded-xl">
						<h2 className="mb-4 text-xl font-bold">
							Salles communautaire
						</h2>
						<div className="flex flex-col w-full gap-4">
							{rooms.map((room) => (
								<CardRoom
									key={room.id}
									room={room}
									communityId={communityId}
									role={role}
								/>
							))}
						</div>
					</div>
				</div>

				<div className="w-[35%]">
					<ChatCommu roomId={communityId} Role={role} />
				</div>

				<div className="w-[25%]">
					<CommunityMembers
						communityId={communityId}
						Role={role}
					></CommunityMembers>
				</div>
			</div>
		</div>
	);
}
