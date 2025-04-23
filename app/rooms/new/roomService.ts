import { db } from '@/app/firebase';
import {
	collection,
	addDoc,
	serverTimestamp,
	updateDoc,
	doc,
	arrayUnion,
} from 'firebase/firestore';

export const createRoom = async (
	roomName: string,
	communityID: string,
	idAdmin: string
) => {
	// Validation
	if (!roomName.trim()) {
		console.error('Erreur: Le nom de la room est vide');
		throw new Error('Le nom de la room ne peut pas être vide !');
	}

	try {
		// Création de la room
		const docRef = await addDoc(collection(db, 'rooms'), {
			name: roomName,
			community: communityID,
			admin: idAdmin,
			createdAt: serverTimestamp(),
		});

		console.log('Room créée avec ID :', docRef.id);

		// Mise à jour de la communauté pour ajouter l'ID de la nouvelle room
		const communityRef = doc(db, 'communities', communityID);

		await updateDoc(communityRef, {
			rooms: arrayUnion(docRef.id),
		});

		return docRef.id;
	} catch (error) {
		console.error(
			'Erreur Firebase lors de la création de la room :',
			error
		);
		throw new Error(
			'Échec de la création de la room:' /* + (error as Error).message*/
		);
	}
};
