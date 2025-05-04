import { db } from '@/app/firebase';
import { NextRequest, NextResponse } from 'next/server';
import {
	addDoc,
	collection,
	doc,
	getDoc,
	serverTimestamp,
	updateDoc,
} from 'firebase/firestore';

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
	try {
		const { roomId } = params;
		const body = await req.json();
		const { url, user } = body;

		if (!url || !user) {
			return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
		}

		const waitRef = collection(db, `rooms/${roomId}/wait_links`);

		// Ajoute à la file d'attente
		await addDoc(waitRef, {
			text: url,
			user,
			timestamp: serverTimestamp(),
		});

		// 🔍 Vérifie si une vidéo est en cours
		const currentRef = doc(db, 'rooms', roomId);
		const currentSnap = await getDoc(currentRef);
		const currentData = currentSnap.data();

		const hasCurrentVideo = currentData?.currentVideo?.url;

		if (!hasCurrentVideo) {
			// 🎬 Force cette vidéo comme première vidéo
			await updateDoc(currentRef, {
				currentVideo: {
					url,
					playing: true,
					timestamp: 0,
					lastUpdate: serverTimestamp(),
					forcedBy: user,
				},
			});
		}

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('Erreur API /add-video:', err);
		return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
	}
}
