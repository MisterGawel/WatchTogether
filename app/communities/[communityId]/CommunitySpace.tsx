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
import CardRoom from '../(community-room)/CardRoom';
import CardAnnonce from '../(community-room)/CardAnnonces';
import InputAnnonce from '../(community-room)/inputAnnonce';
import InputRoom from '../(community-room)/InputRoom';
import getUsersInCommunity from '../(community-room)/AfficherMembre';
import CommunityMembers from '../(community-room)/AfficherMembre';

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
	const [user, setUser] = useState(null);
	const [communities, setCommunities] = useState({}); //Communaute du user verification admin

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
	/*AJOUT D'ANNONCE*/
	const addAnnonce = async () => {
		if (newAnnonce.trim() !== '') {
			try {
				const newAnnonceObj = newAnnonce;
				const communityDocRef = doc(db, 'communities', communityId);
				const communityDocSnapshot = await getDoc(communityDocRef);
				if (communityDocSnapshot.exists()) {
					const currentAnnonces =
						communityDocSnapshot.data().announcements || [];
					const updatedAnnonces = [...currentAnnonces, newAnnonceObj];
					// Mettre à jour le document dans Firestore
					await updateDoc(communityDocRef, {
						announcements: updatedAnnonces,
					});

					// Mettre à jour l'état local
					setAnnonces(updatedAnnonces);
					setNewAnnonce('');
				} else {
					// console.log("Le document de la communauté n'existe pas !");
				}
			} catch (error) {
				// console.error("Erreur lors de l'ajout de l'annonce :", error);
			}
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
	return (
		<div className="flex flex-col min-h-screen p-8">
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
								as={Link}
								href={`/communities`}
							>
								<BsFillMegaphoneFill />
							</Button>
							<Button
								color="primary"
								isIconOnly
								size="md"
								as={Link}
								href={`/communities`}
							>
								<BsFillCameraVideoFill />
							</Button>
							<Button
								color="primary"
								isIconOnly
								size="md"
								as={Link}
								href={`/communities`}
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
					{/* Ajouter une annonce (visible uniquement pour l'admin) */}
					<InputAnnonce
						role={role}
						ValeurChamp={newAnnonce}
						foncNewAnnonce={(e) => setNewAnnonce(e.target.value)}
						foncaddAnnonce={addAnnonce}
					></InputAnnonce>

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
					<InputRoom
						role={role}
						communityId={communityId}
					></InputRoom>
					{/* Affichage des cartes*/}
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
