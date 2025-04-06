import { db } from "../../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const createRoom = async (roomName: string, communityID: string, idAdmin: string) => {
    // Validation
    if (!roomName.trim()) {
        console.error("Erreur: Le nom de la room est vide");
        throw new Error("Le nom de la room ne peut pas être vide !");
    }

    try {
        // Création de la room
        const docRef = await addDoc(collection(db, "rooms"), {
            name: roomName,
            community: communityID,
            admin: idAdmin,
            createdAt: serverTimestamp(),
        });

        console.log("Room créée avec ID :", docRef.id);
        return docRef.id;

    } catch (error) {
        console.error("Erreur Firebase lors de la création de la room :", error);
        throw new Error("Échec de la création de la room:"/* + (error as Error).message*/);
    }
};