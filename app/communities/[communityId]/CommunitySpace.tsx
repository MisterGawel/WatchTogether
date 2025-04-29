'use client';
import { useState, useEffect } from 'react';
import { FaUsers } from 'react-icons/fa';
import ChatCommu from '../(community-room)/chat';
import { BsFillMegaphoneFill } from 'react-icons/bs';
import { Card, CardHeader, Link } from '@heroui/react';
import { Button } from '@heroui/button';
import { db, auth } from '@/app/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { BsFillCameraVideoFill } from 'react-icons/bs';
import {
	onSnapshot,
	getDoc,
	doc,
	updateDoc,
	deleteDoc,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import CardRoom from '../(community-room)/CardRoom';
import CardAnnonce from '../(community-room)/CardAnnonces';
import getUsersInCommunity from '../(community-room)/AfficherMembre';
import CommunityMembers from '../(community-room)/AfficherMembre';
import type { User } from 'firebase/auth';

export default function CommunitySpace({
	communityId,
}: {
	communityId: string;
}) {
	const Members = getUsersInCommunity(communityId);
	const [rooms, setRoom] = useState([]);
	const [communityName, setCommunityName] = useState('');
	const [annonces, setAnnonces] = useState([]);
	const [newAnnonce, setNewAnnonce] = useState('');
	const [user, setUser] = useState<User | null>(null);
	const [communities, setCommunities] = useState({});

	/*Suppression d'annonces */
	const deleteAnnonce = async (index) => {
		try {
			const communityDocRef = doc(db, 'communities', communityId);
			const communityDocSnapshot = await getDoc(communityDocRef);
			if (communityDocSnapshot.exists()) {
				const currentAnnonces =
					communityDocSnapshot.data().announcements;
				if (index >= 0 && index < currentAnnonces.length) {
					const updatedAnnonces = currentAnnonces.filter(
						(_, idx) => idx !== index
					);
					await updateDoc(communityDocRef, {
						announcements: updatedAnnonces,
					});

					setAnnonces(updatedAnnonces);
				} else {
					console.log("Index d'annonce invalide !", index);
				}
			} else {
				console.log("Le document de la communauté n'existe pas !");
			}
		} catch (error) {
			console.error(
				"Erreur lors de la suppression de l'annonce :",
				error
			);
		}
	};

	/*Suppression Room */
	const deleteRoom = async (roomId) => {
		try {
			const communityDocRef = doc(db, 'communities', communityId);
			const communityDocSnapshot = await getDoc(communityDocRef);

			if (communityDocSnapshot.exists()) {
				const currentRooms = communityDocSnapshot.data().rooms || [];

				// Vérifier si la roomId existe dans la liste
				// console.log(
				// 	'current room : ',
				// 	currentRooms,
				// 	'roomID : ',
				// 	roomId
				// );
				if (currentRooms.includes(roomId)) {
					const roomDocRef = doc(db, 'rooms', roomId);
					await deleteDoc(roomDocRef);
					const updatedRooms = currentRooms.filter(
						(id) => id !== roomId
					);
					await updateDoc(communityDocRef, { rooms: updatedRooms });
					setRoom((prevRooms) =>
						prevRooms.filter((room) => room.id !== roomId)
					);
				} else {
					// console.log(
					// 	"L'ID de la salle ne se trouve pas dans la communauté !"
					// );
				}
			} else {
				// console.log("Le document de la communauté n'existe pas !");
			}
		} catch (error) {
			// console.error('Erreur lors de la suppression de la salle :', error);
		}
	};

	/* RECUPERATION DE LA BASE DE DONNEES AFFICHAGE */
	const DonnéesBase = async () => {
		try {
			const communitiesRef = doc(db, 'communities', communityId);

			// ON ECOUTE en direct
			onSnapshot(communitiesRef, async (communityDocSnapshot) => {
				if (communityDocSnapshot.exists()) {
					const data = communityDocSnapshot.data();

					setCommunityName(data.name);

					const roomsId = data.rooms || [];

					// Charge les rooms
					const roomPromises = roomsId.map(async (roomId) => {
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
				setUser(currentUser);

				const docRef = doc(db, 'users', currentUser.uid);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					const data = docSnap.data();
					setCommunities(data.communities || {});
				}
			} else {
				setUser(null);
				setCommunities({});
			}
		});

		return () => unsubscribe();
	}, []);
	useEffect(() => {
		DonnéesBase();
	}, []);

	const isAdmin = (communityId) => {
		return communities[communityId] === 'admin';
	};

	let role = 'member';
	if (isAdmin(communityId)) {
		role = 'admin';
	}

	const router = useRouter();
	return (
		<div className="flex flex-col min-h-full p-8">
			<div className="flex justify-between gap-8">
				<Card className="w-full py-2">
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
								color="primary"
								isIconOnly
								size="md"
								as={Link}
								href={`/communities/members`}
							>
								<FaUsers />
							</Button>
						</div>
					</CardHeader>
				</Card>
			</div>
			<div className="flex flex-grow">
				{/* Section Annonces et Cartes */}
				<div className="w-2/3 p-4 overflow-y-auto">
					<h2 className="mb-4 text-xl font-bold">Annonces</h2>
					{annonces.map((annonce, index) => (
						<CardAnnonce
							key={index}
							annonce={annonce}
							Suppresion={() => deleteAnnonce(index)}
							role={role}
						></CardAnnonce>
					))}
					{/* Section Salle (Événements, Infos, etc.) */}
					<h2 className="mt-6 mb-4 text-xl font-bold">Salles</h2>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{rooms.map((room) => (
							<CardRoom
								key={room.id}
								id={room.id}
								room={room.name}
								role={role}
								Suppresion={() => deleteRoom(room.id)}
							/>
						))}
					</div>
					<CommunityMembers
						communityId={communityId}
						Role={role}
					></CommunityMembers>
				</div>
				{/* Section Chat */}
				<div className="flex-1 p-4 bg-grey-100">
					<ChatCommu roomId={communityId} Role={role} />
				</div>
			</div>
		</div>
	);
}
