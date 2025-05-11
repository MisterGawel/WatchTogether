// components/room/messageManagement.ts
'use client';

import { db } from '@/app/firebase';
import { writeBatch, collection, getDocs } from 'firebase/firestore';

export async function deleteAllMessages(roomId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const messagesRef = collection(db, `chats/${roomId}/messages`);
    const messagesSnapshot = await getDocs(messagesRef);

    messagesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Erreur suppression messages:', error);
    throw error;
  }
}