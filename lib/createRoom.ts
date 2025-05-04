import {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	serverTimestamp,
	arrayUnion,
} from 'firebase/firestore';
import { db } from '@/app/firebase';
import { v4 as uuidv4 } from 'uuid';

export const createRoom = async (
	roomName: string,
	communityID: string | null,
	idAdmin: string | null
): Promise<string> => {
	if (!roomName.trim()) {
		throw new Error('Le nom de la room ne peut pas être vide.');
	}

	try {
		// 1. Générer un ID unique
		const roomId = uuidv4();
		const roomRef = doc(db, 'rooms', roomId);

		// 2. Préparer les données de la room
		const roomData: {
			name: string;
			createdAt: any;
			admin?: string;
			community?: string;
			currentVideo: {
				url: string;
				playing: boolean;
				timestamp: number;
				lastUpdate: any;
				forcedBy: string | null;
			};
		} = {
			name: roomName,
			createdAt: serverTimestamp(),
			currentVideo: {
				url: '',
				playing: false,
				timestamp: 0,
				lastUpdate: serverTimestamp(),
				forcedBy: null,
			},
		};

		if (idAdmin) roomData.admin = idAdmin;
		if (communityID) roomData.community = communityID;

		// 3. Créer la room dans Firestore
		await setDoc(roomRef, roomData);

		// 4. Associer l'utilisateur si connecté
		if (idAdmin) {
			const userRef = doc(db, 'users', idAdmin);
			const userSnap = await getDoc(userRef);
			if (userSnap.exists()) {
				await updateDoc(userRef, {
					[`rooms.${roomId}`]: true,
				});
			}
		}

		// 5. Associer à la communauté si précisé
		if (communityID) {
			const communityRef = doc(db, 'communities', communityID);
			const communitySnap = await getDoc(communityRef);
			if (communitySnap.exists()) {
				await updateDoc(communityRef, {
					rooms: arrayUnion(roomId),
				});
			} else {
				await setDoc(communityRef, {
					rooms: [roomId],
				});
			}
		}

		return roomId;
	} catch (err) {
		console.error('Erreur Firebase :', err);
		throw new Error("Échec de la création de la room.");
	}
};
