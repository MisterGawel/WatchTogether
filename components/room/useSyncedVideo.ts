import { useEffect, useRef, useState } from 'react';
import {
	doc,
	onSnapshot,
	updateDoc,
	serverTimestamp,
	setDoc,
} from 'firebase/firestore';
import { db } from '@/app/firebase';

type VideoState = {
	url: string;
	playing: boolean;
	timestamp: number; // en secondes
	lastUpdate: Date;
	forcedBy?: string;
};

export function useSyncedVideo(roomId: string) {
	const [videoState, setVideoState] = useState<VideoState | null>(null);
	const lastKnownTime = useRef(0);

	useEffect(() => {
		if (!roomId) return;

		const ref = doc(db, `rooms/${roomId}/currentVideo/now`);
		const unsub = onSnapshot(ref, (snap) => {
			if (!snap.exists()) return;
			const data = snap.data();
			setVideoState({
				url: data.url,
				playing: data.playing,
				timestamp: data.timestamp,
				lastUpdate: data.lastUpdate?.toDate?.() ?? new Date(),
				forcedBy: data.forcedBy,
			});
		});
		return () => unsub();
	}, [roomId]);

	const updateVideoState = async (newState: Partial<VideoState>) => {
		const ref = doc(db, `rooms/${roomId}/currentVideo/now`);
		await updateDoc(ref, {
			...newState,
			lastUpdate: serverTimestamp(),
		});
	};

	const forceNewVideo = async (url: string, userId: string) => {
		const ref = doc(db, `rooms/${roomId}/currentVideo/now`);
		await setDoc(ref, {
			url,
			playing: true,
			timestamp: 0,
			lastUpdate: serverTimestamp(),
			forcedBy: userId,
		});
	};

	return {
		videoState,
		updateVideoState,
		forceNewVideo,
	};
}
