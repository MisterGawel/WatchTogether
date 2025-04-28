'use client';
import { useState, useEffect } from 'react';
import ChatCommu from './chat';
import { Card, CardHeader,Link} from '@heroui/react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { db, auth } from '@/app/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
	onSnapshot,
	getDoc,
	doc,
	updateDoc,
	deleteDoc,

} from 'firebase/firestore';
import CardRoom from './CardRoom';
import CardAnnonce from './CardAnnonces';
import InputAnnonce from './inputAnnonce';
import InputRoom from './InputRoom';
import getUsersInCommunity from './AfficherMembre'
import CommunityMembers from './AfficherMembre';
export default function CommunitySpace({ Room }) {
	const CommuID = Room;
	const Members = getUsersInCommunity(CommuID);
	const [rooms, setRoom] = useState([]);
	const [nomCommu, setNomCommu] = useState('');
	const [annonces, setAnnonces] = useState([]);
	const [newAnnonce, setNewAnnonce] = useState('');
	const [user, setUser] = useState(null);
	const [communities, setCommunities] = useState({}); //Communaute du user verification admin

	
	/*Suppression d'annonces */
	const deleteAnnonce = async (index) => {
		try {
			const communityDocRef = doc(db, 'communities', CommuID);
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
				const communityDocRef = doc(db, 'communities', CommuID);
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
			const communityDocRef = doc(db, 'communities', CommuID);
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
			const communitiesRef = doc(db, 'communities', CommuID);
	
			// ON ECOUTE en direct
			onSnapshot(communitiesRef, async (communityDocSnapshot) => {
				if (communityDocSnapshot.exists()) {
					const data = communityDocSnapshot.data();
	
					setNomCommu(data.name);
	
					const roomsId = data.rooms || [];
	
					// Charge les rooms
					const roomPromises = roomsId.map(async (roomId) => {
						const roomRef = doc(db, 'rooms', roomId);
						const roomSnapshot = await getDoc(roomRef);
						return roomSnapshot.exists()
							? { id: roomId, ...roomSnapshot.data() }
							: null;
					});
					const rooms = (await Promise.all(roomPromises)).filter((room) => room !== null);
					setRoom(rooms);
	
					// Charge les annonces
					const announcements = data.announcements || [];
					setAnnonces(announcements);
				} else {
					console.log("Le document de la communauté n'existe pas !");
				}
			});
		} catch (error) {
			console.error("Erreur lors de la récupération des données :", error);
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
	// console.log('user : ', user);
	let role = 'member';
	if (isAdmin(CommuID)) {
		role = 'admin';
	}
	return (
		<div className="flex flex-col min-h-screen">
			{/* En-tête avec le nom de la communauté */}

			<div className="flex justify-between gap-8">
				<Card className="w-1/2">
					<CardHeader>{nomCommu}</CardHeader>
				</Card>
				<Card className="w-1/2">
					<CardHeader>{nomCommu}</CardHeader>
				</Card>
			</div>

			<header className="py-4 text-2xl font-bold text-center text-black bg-gray-400 shadow-md">
				{nomCommu}
			</header>
			<div className="flex flex-grow">
				{/* Section Annonces et Cartes */}
				<div className="w-2/3 p-4 overflow-y-auto bg-gray-100">
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
						commuID={CommuID}
					></InputRoom>
					{/* Affichage des cartes*/}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
					<CommunityMembers communityId={CommuID} Role={role}></CommunityMembers>
				</div>
				{/* Section Chat */}
				<div className="flex-1 p-4 bg-grey-100">
					<ChatCommu roomId={CommuID} Role={role} />
				</div>
			</div>
		</div>
	);
}
