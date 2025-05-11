// components/room/roomManagement.ts
'use client';

import { db } from '@/app/firebase';
import { doc, getDoc, writeBatch, collection, getDocs,updateDoc } from 'firebase/firestore';
import { ShareOptions } from './types';
export async function fetchRoomData(roomId: string) {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnapshot = await getDoc(roomRef);

    if (roomSnapshot.exists()) {
      return roomSnapshot.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching room:', error);
    throw error;
  }
}

export async function deleteRoom(roomId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const roomRef = doc(db, 'rooms', roomId);
    
    const messagesRef = collection(db, `chats/${roomId}/messages`);
    const messagesSnapshot = await getDocs(messagesRef);
    messagesSnapshot.forEach(doc => batch.delete(doc.ref));

    batch.delete(roomRef);
    await batch.commit();
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw error;
  }
}

export async function renameRoom(roomId: string, name: string): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      name,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors du renommage de la room:', error);
    throw error;
  }
}

export async function copyRoomLink(roomId: string): Promise<void> {
  try {
    const roomLink = `${window.location.origin}/rooms/${roomId}`;
    await navigator.clipboard.writeText(roomLink);
  } catch (error) {
    console.error('Copy failed:', error);
    throw error;
  }
}


export const shareOnWhatsApp = ({ roomName, roomUrl }: ShareOptions) => {
  const message = `Rejoignez ma room ${roomName} sur ${roomUrl}`;
  window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    '_blank'
  );
};

export const shareOnTelegram = ({ roomName, roomUrl }: ShareOptions) => {
  const message = `Rejoignez ma room ${roomName} sur ${roomUrl}`;
  window.open(
    `https://t.me/share/url?text=${encodeURIComponent(message)}`,
    '_blank'
  );
};

export const getShareMessage = ({ roomName, roomUrl }: ShareOptions) => {
  return `Rejoignez ma room ${roomName} sur ${roomUrl}`;
};