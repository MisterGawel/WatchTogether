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
	setDoc,
	addDoc,
	serverTimestamp,
	runTransaction,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
	req: NextRequest,
	// on indique que params est un Promise
	{ params }: { params: Promise<{ roomId: string }> }
): Promise<NextResponse> {
	// on attend la résolution avant d'extraire roomId
	const { roomId } = await params;

	if (!roomId) {
		return NextResponse.json({ error: 'roomId manquant' }, { status: 400 });
	}
	try {
		if (!roomId) {
			return NextResponse.json(
				{ error: 'roomId manquant' },
				{ status: 400 }
			);
		}

		const roomRef = doc(db, 'rooms', roomId);
		const waitRef = collection(db, `rooms/${roomId}/wait_links`);
		const historyRef = collection(db, `rooms/${roomId}/history`);

		// 🔍 Lire en dehors de la transaction l'ID du document à jouer
		const waitSnap = await getDocs(query(waitRef, limit(1)));
		if (waitSnap.empty) {
			// ❌ File vide → on vide la vidéo actuelle
			await setDoc(
				roomRef,
				{
					currentVideo: {
						url: '',
						playing: false,
						timestamp: 0,
						lastUpdate: serverTimestamp(),
						forcedBy: '',
						updateToken: uuidv4(),
					},
				},
				{ merge: true }
			);
			return NextResponse.json({
				message: 'File vide, lecture arrêtée.',
			});
		}

		const docToPlay = waitSnap.docs[0];
		const videoId = docToPlay.id;
		const videoRef = doc(db, `rooms/${roomId}/wait_links/${videoId}`);
		const videoData = docToPlay.data();

		// ✅ Transaction pour supprimer et écrire la vidéo actuelle de façon atomique
		await runTransaction(db, async (transaction) => {
			transaction.delete(videoRef);

			const cleanVideo = {
				url: videoData.text ?? '',
				playing: true,
				timestamp: 0,
				lastUpdate: serverTimestamp(),
				forcedBy: videoData.user ?? 'inconnu',
				updateToken: uuidv4(),
			};

			transaction.set(
				roomRef,
				{ currentVideo: cleanVideo },
				{ merge: true }
			);
		});

		//On relis la vidéo actuelle pour s'assurer qu'elle est bien jouée
		// @ts-expect-error blabla
		const roomSnap = await getDocs(roomRef);
		// @ts-expect-error blabla
		const roomData = roomSnap.data();

		// ✅ Ajouter à l'historique (hors transaction)
		await addDoc(historyRef, {
			text: videoData.text ?? '',
			title: videoData.title ?? '',
			thumbnail: videoData.thumbnail ?? '',
			user: videoData.user ?? 'inconnu',
			timestamp: serverTimestamp(),
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('Erreur /next-video (corrigée):', err);
		return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
	}
}
