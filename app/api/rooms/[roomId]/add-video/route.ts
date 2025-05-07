import { db } from '@/app/firebase';
import { NextRequest, NextResponse } from 'next/server';
import {
	addDoc,
	collection,
	doc,
	getDoc,
	serverTimestamp,
	updateDoc,
	getDocs,
	query,
	limit,
} from 'firebase/firestore';

export async function POST(req: NextRequest) {
	try {
		const { pathname } = req.nextUrl;
		const match = pathname.match(/\/rooms\/([^/]+)\//);
		const roomId = match ? match[1] : null;

		if (!roomId) {
			return NextResponse.json(
				{ error: 'Paramètre roomId manquant' },
				{ status: 400 }
			);
		}

		const body = await req.json();
		const { url, user, title, thumbnail } = body;

		if (!url || !user) {
			return NextResponse.json(
				{ error: 'Paramètres manquants' },
				{ status: 400 }
			);
		}

		const roomRef = doc(db, 'rooms', roomId);
		const roomSnap = await getDoc(roomRef);
		const roomData = roomSnap.data();
		const hasCurrentVideo = roomData?.currentVideo?.url;

		const waitRef = collection(db, `rooms/${roomId}/wait_links`);
		const historyRef = collection(db, `rooms/${roomId}/history`);

		// Vérifie s'il y a déjà des vidéos dans la file
		const waitSnapshot = await getDocs(query(waitRef, limit(1)));
		const hasQueue = !waitSnapshot.empty;

		if (!hasCurrentVideo && !hasQueue) {
			// 🎬 Pas de vidéo en cours et file vide => on joue direct
			await updateDoc(roomRef, {
				currentVideo: {
					url,
					playing: true,
					timestamp: 0,
					lastUpdate: serverTimestamp(),
					forcedBy: user,
				},
			});

			// 📝 On ajoute à l'historique
			await addDoc(historyRef, {
				text: url,
				user,
				title,
				thumbnail,
				timestamp: serverTimestamp(),
			});
		} else {
			// 🗂 Sinon on l’ajoute à la file
			await addDoc(waitRef, {
				text: url,
				user,
				title,
				thumbnail,
				timestamp: serverTimestamp(),
			});
		}

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('Erreur API /add-video:', err);
		return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
	}
}
