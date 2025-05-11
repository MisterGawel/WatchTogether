// components/room/linkManagement.ts
'use client';

import { db } from '@/app/firebase';
import { writeBatch, collection, getDocs } from 'firebase/firestore';

export async function deleteAllLinks(roomId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    const collectionsToDelete = ['wait_links', 'hist_links', 'lecture'];
    for (const collectionName of collectionsToDelete) {
      const colRef = collection(db, `chats/${roomId}/${collectionName}`);
      const snapshot = await getDocs(colRef);
      snapshot.forEach((doc) => batch.delete(doc.ref));
    }

    await batch.commit();
  } catch (error) {
    console.error('Erreur suppression liens:', error);
    throw error;
  }
}