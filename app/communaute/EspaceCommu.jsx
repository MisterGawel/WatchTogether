'use client';
import { useState, useEffect } from 'react';
import ChatCommu from './chat';
import { Card, CardHeader, CardBody, Image } from '@heroui/react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { db, auth } from '@/app/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
	getDoc,
	collection,
	doc,
	updateDoc,
	deleteDoc,
	setDoc,
} from 'firebase/firestore';
import CardRoom from './CardRoom';
import CardAnnonce from './CardAnnonces';
import InputAnnonce from './inputAnnonce';
import InputRoom from './InputRoom';
export default function CommunitySpace({ Room }) {
	const CommuID = Room;
	const [rooms, setRoom] = useState([]);
	const [nomCommu, setNomCommu] = useState('');
	const [annonces, setAnnonces] = useState([]);
	const [newAnnonce, setNewAnnonce] = useState('');
	const [newRoomName, setNewRoomName] = useState('');
	const [user, setUser] = useState(null);
	const [communities, setCommunities] = useState({}); //Communaute du user
	// Fonction pour ajouter une salle à Firestore et à l'état local
	const addRoom = async () => {
		const newRoomId = Date.now().toString();
		if (newRoomName.trim() !== '') {
			try {
				const newRoom = {
					name: newRoomName,
					member: {},
					id: newRoomId,
					communityID: CommuID,
				};
				await setDoc(doc(db, 'rooms', newRoomId), newRoom);
				const communityRef = doc(db, 'communities', CommuID);
				const communityDocSnapshot = await getDoc(communityRef);
				if (communityDocSnapshot.exists()) {
					const currentRooms =
						communityDocSnapshot.data().rooms || [];
					const updatedRooms = [...currentRooms, newRoomId];
					// Mise à jour Firestore
					await updateDoc(communityRef, { rooms: updatedRooms });
					// Mettre à jour l'état local
					setRoom((prevRooms) => [
						...prevRooms,
						{ id: newRoomId, name: newRoomName, member: {} },
					]);
					// console.log('Salle ajoutée avec succès !');
				} else {
					// console.log("Le document de la communauté n'existe pas !");
				}
				// Réinitialiser les champs
				setNewRoomName('');
			} catch (error) {
				// console.error("Erreur lors de l'ajout de la salle :", error);
			}
		} else {
			// console.log('Tous les champs doivent être remplis !');
		}
	};
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
			const communityDocSnapshot = await getDoc(communitiesRef);
			const name = communityDocSnapshot.data().name;
			setNomCommu(name); // Mettre à jour l'état avec le nom de la communauté

			if (communityDocSnapshot.exists()) {
				const roomsId = communityDocSnapshot.data().rooms;
				const roomPromises = roomsId.map(async (roomId) => {
					const roomRef = doc(db, 'rooms', roomId);
					const roomSnapshot = await getDoc(roomRef);
					if (!roomSnapshot.exists()) {
						// console.log(
						// 	`La room avec ID ${roomId} n'existe pas dans Firestore.`
						// );
					} else {
						// console.log(` Room trouvée :`, roomSnapshot.data());
					}
					return roomSnapshot.exists()
						? { id: roomId, ...roomSnapshot.data() }
						: null;
				});
				const rooms = (await Promise.all(roomPromises)).filter(
					(room) => room !== null
				); // Supprimer les null
				console.log(rooms);
				setRoom(rooms);
				// Récupérer les annonces depuis le champ 'announcements'
				const announcements = communityDocSnapshot.data().announcements;
				// changement possible pour pouvoir récupére des données des rooms

				if (Array.isArray(announcements)) {
					console.log(announcements);

					setAnnonces(announcements); // Mettre à jour l'état avec les annonces récupérées
				} else {
					// console.log(
					// 	"Le champ 'announcements ou rooms' n'est pas un tableau."
					// );
				}
			} else {
				// console.log("Le document de la communauté n'existe pas !");
			}
		} catch (error) {
			// console.error(
			// 'Erreur lors de la récupération des données :',
			// error
			// );
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
	}, []); // Exécuter une seule fois au chargement

	const isAdmin = (communityId) => {
		return communities[communityId] === 'admin';
	};
	console.log('user : ', user);
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
						ValeurChamp={newRoomName}
						role={role}
						foncNewAnnonce={(e) => setNewRoomName(e.target.value)}
						foncaddAnnonce={addRoom}
					></InputRoom>
					{/* Affichage des cartes*/}
					<div className="grid grid-cols-3 gap-4">
						{rooms.map((room) => (
							<CardRoom
								key={room.id}
								room={room.name}
								role={role}
								Suppresion={() => deleteRoom(room.id)}
							></CardRoom>
						))}
					</div>
				</div>
				{/* Section Chat */}
				<div className="flex-1 p-4 bg-grey-100">
					<ChatCommu roomId={CommuID} Role={role} />
				</div>
			</div>
		</div>
	);
}
