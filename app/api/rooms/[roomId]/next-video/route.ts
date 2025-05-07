// app/api/rooms/[roomId]/next-video/route.ts

import { db } from '@/app/firebase';
import { NextRequest, NextResponse } from 'next/server';
import {
	doc,
	collection,
	getDocs,
	query,
	limit,
	deleteDoc,
	updateDoc,
	addDoc,
	serverTimestamp,
	getDoc,
} from 'firebase/firestore';

export async function POST(
	req: NextRequest,
	{ params }: { params: { roomId: string } }
) {
	try {
		const roomId = params.roomId;
		if (!roomId) {
			return NextResponse.json({ error: 'roomId manquant' }, { status: 400 });
		}

		const roomRef = doc(db, 'rooms', roomId);
		const waitRef = collection(db, `rooms/${roomId}/wait_links`);
		const historyRef = collection(db, `rooms/${roomId}/history`);

		// 🔁 Vérifie si une vidéo est déjà en cours de mise à jour
		const roomSnap = await getDoc(roomRef);
		const current = roomSnap.data()?.currentVideo;

		// Protection anti-double appel : si une vidéo a été mise à jour dans la dernière seconde, on ignore
		if (
			current?.lastUpdate?.toMillis &&
			Date.now() - current.lastUpdate.toMillis() < 1000
		) {
			console.warn('Mise à jour trop récente, ignorer appel concurrent');
			return NextResponse.json({ skipped: true });
		}

		// 🔍 Récupère la première vidéo de la file
		const waitSnap = await getDocs(query(waitRef, limit(1)));

		if (waitSnap.empty) {
			// ❌ File vide → on retire la vidéo actuelle
			await updateDoc(roomRef, {
				currentVideo: {}, // Vide complètement
			});
			return NextResponse.json({ message: 'File vide, lecture arrêtée.' });
		}

		// ✅ Lecture de la première vidéo
		const videoDoc = waitSnap.docs[0];
		const videoData = videoDoc.data();
		const videoId = videoDoc.id;

		// ✅ Met à jour la vidéo actuelle
		await updateDoc(roomRef, {
			currentVideo: {
				url: videoData.text,
				playing: true,
				timestamp: 0,
				lastUpdate: serverTimestamp(),
				forcedBy: videoData.user || 'inconnu',
			},
		});

		// ✅ Supprime de la file
		await deleteDoc(doc(waitRef, videoId));

		// ✅ Ajoute à l'historique
		await addDoc(historyRef, {
			text: videoData.text,
			title: videoData.title || '',
			thumbnail: videoData.thumbnail || '',
			user: videoData.user || 'inconnu',
			timestamp: serverTimestamp(),
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('Erreur /next-video:', err);
		return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
	}
}
