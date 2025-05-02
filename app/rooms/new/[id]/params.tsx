// paramsManager.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/app/firebase';
import {
  doc,
  getDoc,
  writeBatch,
  collection,
  getDocs,
  updateDoc,
  where,
  query,
  runTransaction,
  setDoc,
} from 'firebase/firestore';

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

        const roomRef = doc(db, 'rooms', roomId);
        const roomSnapshot = await getDoc(roomRef);

        if (roomSnapshot.exists()) {
          const data = roomSnapshot.data();
          setRoomData({
            name: data?.name || 'No name available',
            community: data?.community || 'No community ID',
            admin: data?.admin || 'No admin ID',
          });
        }
      } catch (error) {
        console.error('Error fetching room:', error);
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
    setResolvedParams,
  };
};

export async function updateUserMessages(roomId: string, oldName: string, newName: string) {
  try {
    if (newName.trim().length > 20) {
      throw new Error('Le pseudo ne doit pas dépasser 20 caractères');
    }
    
    const collectionsToUpdate = [
      `chats/${roomId}/messages`,
      `chats/${roomId}/wait_links`,
      `chats/${roomId}/hist_links`,
      `chats/${roomId}/lecture`
    ];

    const batch = writeBatch(db);
    let batchCount = 0;

    for (const collectionPath of collectionsToUpdate) {
      const colRef = collection(db, collectionPath);
      const querySnapshot = await getDocs(query(colRef, where('user', '==', oldName)));

      for (const docSnap of querySnapshot.docs) {
        batch.update(docSnap.ref, { user: newName });
        batchCount++;

        if (batchCount === 500) {
          await batch.commit();
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return true;
  } catch (error) {
    console.error("Erreur Firestore lors de la mise à jour:", error);
    throw error;
  }
}

// Fonction pour vérifier si un utilisateur est banni
export async function checkIfUserIsBanned(roomId: string, userId: string): Promise<boolean> {
  const banRef = doc(db, `chats/${roomId}/banned_users`, userId);
  const banSnap = await getDoc(banRef);
  return banSnap.exists();
}

export const useRoomActions = (
  resolvedParams: RoomParams | null,
  roomData: { admin: string } | null,
  currentUser: any
) => {
  const router = useRouter();

  const isAdmin = currentUser && roomData?.admin === currentUser.uid;

  const handleCopyLink = () => {
    if (resolvedParams?.id) {
      const roomLink = `${window.location.origin}/rooms/new/${resolvedParams.id}`;
      navigator.clipboard
        .writeText(roomLink)
        .then(() => alert('Lien copié dans le presse-papier !'))
        .catch((error) => console.error('Copy failed:', error));
    }
  };

  const handleDeleteRoom = async () => {
    if (!resolvedParams?.id) return;

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette room ?')) {
      return;
    }

    try {
      const batch = writeBatch(db);
      const roomRef = doc(db, 'rooms', resolvedParams.id);
      
      const messagesRef = collection(db, `chats/${resolvedParams.id}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);
      messagesSnapshot.forEach(doc => batch.delete(doc.ref));

      batch.delete(roomRef);

      await batch.commit();
      alert('Room supprimée avec succès');
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Une erreur est survenue lors de la suppression');
    }
  };

  const handleDeleteAllMessages = async () => {
    if (!resolvedParams?.id) return;

    try {
      const batch = writeBatch(db);
      const messagesRef = collection(db, `chats/${resolvedParams.id}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);

      messagesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      alert('Tous les messages ont été supprimés !');
    } catch (error) {
      console.error('Erreur suppression messages:', error);
      alert('Erreur lors de la suppression des messages');
    }
  };

  const handleDeleteAllLinks = async () => {
    if (!resolvedParams?.id) return;

    try {
      const batch = writeBatch(db);

      const collectionsToDelete = ['wait_links', 'hist_links', 'lecture'];
      for (const collectionName of collectionsToDelete) {
        const colRef = collection(db, `chats/${resolvedParams.id}/${collectionName}`);
        const snapshot = await getDocs(colRef);
        snapshot.forEach((doc) => batch.delete(doc.ref));
      }

      await batch.commit();
      alert('Tous les liens ont été supprimés !');
    } catch (error) {
      console.error('Erreur suppression liens:', error);
      alert('Erreur lors de la suppression des liens');
    }
  };

  const handleRenameUser = async (oldName: string, newName: string) => {
    if (!newName.trim()) {
      alert('Le pseudo ne peut pas être vide');
      return false;
    }

    if (newName.trim() === oldName) {
      return true;
    }

    if (!resolvedParams?.id) {
      alert('Room ID non disponible');
      return false;
    }

    try {
      const messagesRef = collection(db, `chats/${resolvedParams.id}/messages`);
      const pseudoCheckQuery = query(messagesRef, where('user', '==', newName.trim()));
      const pseudoSnapshot = await getDocs(pseudoCheckQuery);
      
      if (!pseudoSnapshot.empty) {
        alert('Ce pseudo est déjà utilisé dans cette room');
        return false;
      }

      const success = await updateUserMessages(resolvedParams.id, oldName, newName.trim());
      
      if (!success) {
        alert('Une erreur est survenue lors de la mise à jour');
        return false;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('guestName', newName.trim());
      }

      if (currentUser?.uid) {
        const activeUserRef = doc(db, `chats/${resolvedParams.id}/active_users`, currentUser.uid);
        await updateDoc(activeUserRef, {
          username: newName.trim(),
          updatedAt: new Date().toISOString()
        });
      }
    
      return true;
    } catch (error) {
      console.error("Erreur lors du changement de pseudo:", error);
      alert("Une erreur technique est survenue");
      return false;
    }
  };

  const handleBan = async (userId: string, userName: string) => {
    if (!resolvedParams?.id || !isAdmin) return;

    if (!window.confirm(`Êtes-vous sûr de vouloir bannir l'utilisateur ${userName} ?`)) {
      return;
    }

    try {
      // Ajouter à la liste des bannis
      const bannedUsersRef = doc(db, `chats/${resolvedParams.id}/banned_users`, userId);
      await setDoc(bannedUsersRef, {
        userId,
        userName,
        bannedAt: new Date().toISOString(),
        bannedBy: currentUser.uid,
        bannedByUsername: currentUser.displayName || currentUser.email || 'Admin'
      });

      // Marquer comme banni dans les utilisateurs actifs
      const activeUserRef = doc(db, `chats/${resolvedParams.id}/active_users`, userId);
      await updateDoc(activeUserRef, {
        isBanned: true,
        bannedAt: new Date().toISOString()
      });

      // Option: Supprimer les messages de l'utilisateur
      // const messagesRef = collection(db, `chats/${resolvedParams.id}/messages`);
      // const userMessagesQuery = query(messagesRef, where('userId', '==', userId));
      // const querySnapshot = await getDocs(userMessagesQuery);
      // const batch = writeBatch(db);
      // querySnapshot.forEach((doc) => batch.delete(doc.ref));
      // await batch.commit();

      alert(`L'utilisateur ${userName} a été banni avec succès`);
      return true;
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      alert('Une erreur est survenue lors du bannissement');
      return false;
    }
  };

  const handleUnban = async (userId: string, userName: string) => {
    if (!resolvedParams?.id || !isAdmin) return;

    try {
      // Retirer de la liste des bannis
      const bannedUsersRef = doc(db, `chats/${resolvedParams.id}/banned_users`, userId);
      await updateDoc(bannedUsersRef, {
        unbannedAt: new Date().toISOString(),
        unbannedBy: currentUser.uid
      });

      // Retirer le statut banni dans les utilisateurs actifs
      const activeUserRef = doc(db, `chats/${resolvedParams.id}/active_users`, userId);
      await updateDoc(activeUserRef, {
        isBanned: false,
        unbannedAt: new Date().toISOString()
      });

      alert(`L'utilisateur ${userName} a été débanni avec succès`);
      return true;
    } catch (error) {
      console.error('Erreur lors du débannissement:', error);
      alert('Une erreur est survenue lors du débannissement');
      return false;
    }
  };

  return {
    isAdmin,
    handleCopyLink,
    handleDeleteRoom,
    handleDeleteAllMessages,
    handleDeleteAllLinks,
    handleRenameUser,
    handleBan,
    handleUnban,
    checkIfUserIsBanned: (userId: string) => 
      resolvedParams?.id ? checkIfUserIsBanned(resolvedParams.id, userId) : Promise.resolve(false)
  };
};