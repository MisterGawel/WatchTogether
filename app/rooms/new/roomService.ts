import { db } from '@/app/firebase';
import {
    collection,
    addDoc,
    serverTimestamp,
    updateDoc,
    doc,
    getDoc,
    setDoc,
    arrayUnion
} from 'firebase/firestore';

export const createRoom = async (
    roomName: string,
    communityID: string | null,
    idAdmin: string | null
) => {
    if (!roomName.trim()) {
        console.error('Erreur: Le nom de la room est vide');
        throw new Error('Le nom de la room ne peut pas être vide !');
    }

    try {
        // 1. Création de la room avec ou sans user/community selon connexion
        const roomData: {
            name: string;
            community?: string | null;
            admin?: string | null;
            createdAt: any;
        } = {
            name: roomName,
            createdAt: serverTimestamp(),
        };

        // Ajout des infos user/community seulement si connecté
        if (idAdmin) {
            roomData.admin = idAdmin;
        }
        if (communityID) {
            roomData.community = communityID;
        }

        const docRef = await addDoc(collection(db, 'rooms'), roomData);
        console.log('Room créée avec ID :', docRef.id);

        // 2. Mise à jour de l'utilisateur seulement si connecté
        if (idAdmin) {
            const userRef = doc(db, 'users', idAdmin);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                await updateDoc(userRef, {
                    [`rooms.${docRef.id}`]: true
                });
            }
        }

        // 3. Association à la communauté seulement si spécifiée
        if (communityID) {
            const communityRef = doc(db, 'communities', communityID);
            await updateDoc(communityRef, {
                rooms: arrayUnion(docRef.id),
            });
        }

        return docRef.id;
    } catch (error) {
        console.error('Erreur Firebase lors de la création de la room :', error);
        throw new Error('Échec de la création de la room.');
    }
};