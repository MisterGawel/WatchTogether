// paramsManager.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../firebase";
import { doc, addDoc, getDoc, deleteDoc, writeBatch, collection, getDocs, onSnapshot, serverTimestamp } from "firebase/firestore";

export interface RoomParams {
    id: string;
    name?: string;
    community?: string;
    admin?: string;
}

export const useRoomParams = (paramsPromise: Promise<any>) => {
    const [roomData, setRoomData] = useState<{
        name: string;
        community: string;
        admin: string;
    } | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [resolvedParams, setResolvedParams] = useState<RoomParams | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const resolved = await paramsPromise;
                setResolvedParams(resolved);
                
                const roomId = resolved?.id;
                if (!roomId) return;

                const roomRef = doc(db, "rooms", roomId);
                const roomSnapshot = await getDoc(roomRef);

                if (roomSnapshot.exists()) {
                    const data = roomSnapshot.data();
                    setRoomData({
                        name: data?.name || "No name available",
                        community: data?.community || "No community ID",
                        admin: data?.admin || "No admin ID"
                    });
                }
            } catch (error) {
                console.error("Error fetching room:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoomData();
    }, [paramsPromise, router]);

    return {
        roomData,
        loading,
        resolvedParams,
        setResolvedParams
    };
};

export const useRoomActions = (resolvedParams: RoomParams | null, roomData: { admin: string } | null, currentUser: any) => {
    const router = useRouter();

    const isAdmin = currentUser && roomData?.admin === currentUser.uid;

    const handleCopyLink = () => {
        if (resolvedParams?.id) {
            const roomLink = `${window.location.origin}/rooms/new/${resolvedParams.id}`;
            navigator.clipboard.writeText(roomLink)
                .catch((error) => console.error("Copy failed:", error));
        }
    };

    const handleDeleteRoom = async () => {
        if (!resolvedParams?.id || !window.confirm("Êtes-vous sûr de vouloir supprimer cette room ?")) {
            return;
        }
    
        try {
            const roomRef = doc(db, "rooms", resolvedParams.id);
            await deleteDoc(roomRef);
            alert("Room supprimée avec succès");
            router.push("/");
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            alert("Une erreur est survenue lors de la suppression");
        }
    };

    const handleDeleteAllMessages = async () => {
        if (!resolvedParams?.id) return;
    
        const batch = writeBatch(db);
        const messagesRef = collection(db, `chats/${resolvedParams.id}/messages`);
        const messagesSnapshot = await getDocs(messagesRef);
    
        messagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    
        await batch.commit();
        alert("Tous les messages ont été supprimés !");
    };

    const handleDeleteAllLinks = async () => {
        if (!resolvedParams?.id) return;
    
        const batch = writeBatch(db);
    
        const waitLinksRef = collection(db, `chats/${resolvedParams.id}/wait_links`);
        const histLinksRef = collection(db, `chats/${resolvedParams.id}/hist_links`);
        const lectureRef = collection(db, `chats/${resolvedParams.id}/lecture`);
    
        const waitLinksSnapshot = await getDocs(waitLinksRef);
        const histLinksSnapshot = await getDocs(histLinksRef);
        const lectureLinksSnapshot = await getDocs(lectureRef);
    
        waitLinksSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    
        histLinksSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        lectureLinksSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    
        await batch.commit();
        alert("Tous les liens (wait + hist + lecture) ont été supprimés !");
    };

    return {
        isAdmin,
        handleCopyLink,
        handleDeleteRoom,
        handleDeleteAllMessages,
        handleDeleteAllLinks
    };
};