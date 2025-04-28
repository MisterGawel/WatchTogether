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
	communityID: string | null,
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
			community: communityID || null, // met null si pas de communauté
			admin: idAdmin,
			createdAt: serverTimestamp(),
		});

		console.log('Room créée avec ID :', docRef.id);

		// Si une communauté est fournie, on l'associe
		if (communityID) {
			const communityRef = doc(db, 'communities', communityID);
			await updateDoc(communityRef, {
				rooms: arrayUnion(docRef.id),
			});
		}

		return docRef.id;
	} catch (error) {
		console.error(
			'Erreur Firebase lors de la création de la room :',
			error
		);
		throw new Error('Échec de la création de la room.');
	}
};
