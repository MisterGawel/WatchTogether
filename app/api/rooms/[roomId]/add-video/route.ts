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
		const { url, user } = body;

		if (!url || !user) {
			return NextResponse.json(
				{ error: 'Paramètres manquants' },
				{ status: 400 }
			);
		}

		const waitRef = collection(db, `rooms/${roomId}/wait_links`);

		await addDoc(waitRef, {
			text: url,
			user,
			timestamp: serverTimestamp(),
		});

		const currentRef = doc(db, 'rooms', roomId);
		const currentSnap = await getDoc(currentRef);
		const currentData = currentSnap.data();

		const hasCurrentVideo = currentData?.currentVideo?.url;

		if (!hasCurrentVideo) {
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
