// components/room/params/userManagement.ts
'use client';

import { db } from '@/app/firebase';
import {
  writeBatch,
  collection,
  getDocs,
  getDoc,
  updateDoc,
  where,
  query,
  doc,
  setDoc
} from 'firebase/firestore';
import { UserRenameParams, BanData } from './types';

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

export async function checkIfUserIsBanned(roomId: string, userId: string): Promise<boolean> {
  const banRef = doc(db, `chats/${roomId}/banned_users`, userId);
  const banSnap = await getDoc(banRef);
  return banSnap.exists();
}

export async function banUser(roomId: string, userId: string, banData: BanData): Promise<boolean> {
  try {
    const bannedUsersRef = doc(db, `chats/${roomId}/banned_users`, userId);
    await setDoc(bannedUsersRef, banData);

    const activeUserRef = doc(db, `chats/${roomId}/active_users`, userId);
    await updateDoc(activeUserRef, {
      isBanned: true,
      bannedAt: banData.bannedAt,
      bannedBy: banData.bannedBy,
      bannedByUsername: banData.bannedByUsername
    });

    return true;
  } catch (error) {
    console.error('Erreur lors du bannissement:', error);
    throw error;
  }
}

export async function unbanUser(roomId: string, userId: string, currentUserId: string): Promise<boolean> {
  try {
    const bannedUsersRef = doc(db, `chats/${roomId}/banned_users`, userId);
    await updateDoc(bannedUsersRef, {
      unbannedAt: new Date().toISOString(),
      unbannedBy: currentUserId
    });

    const activeUserRef = doc(db, `chats/${roomId}/active_users`, userId);
    await updateDoc(activeUserRef, {
      isBanned: false,
      unbannedAt: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Erreur lors du débannissement:', error);
    throw error;
  }
}

export async function renameUser({ roomId, oldName, newName, currentUser }: UserRenameParams): Promise<boolean> {
  if (!newName.trim()) throw new Error('Le pseudo ne peut pas être vide');
  if (newName.trim() === oldName) return true;

  try {
    const messagesRef = collection(db, `chats/${roomId}/messages`);
    const pseudoCheckQuery = query(messagesRef, where('user', '==', newName.trim()));
    const pseudoSnapshot = await getDocs(pseudoCheckQuery);
    
    if (pseudoSnapshot.empty) {
      await updateUserMessages(roomId, oldName, newName.trim());

        if (typeof window !== 'undefined') {
          localStorage.setItem('guestName', newName.trim());
        }

        /*if (currentUser?.uid) {
          const activeUserRef = doc(db, `chats/${roomId}/active_users`, currentUser.uid);
          await updateDoc(activeUserRef, {
            username: newName.trim(),
            updatedAt: new Date().toISOString()
          });
        }*/
      
        return true;
    }
    return false;

    
  } catch (error) {
    console.error("Erreur lors du changement de pseudo:", error);
    throw error;
  }
}