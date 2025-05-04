import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';

type VideoState = {
	url: string;
	playing: boolean;
	timestamp: number;
	lastUpdate: Date;
	forcedBy?: string;
};

export function useSyncedVideo(roomId: string) {
	const [videoState, setVideoState] = useState<VideoState | null>(null);
	const lastKnownTime = useRef(0);

	useEffect(() => {
		if (!roomId) return;

		const roomRef = doc(db, 'rooms', roomId);
		const unsub = onSnapshot(roomRef, (snap) => {
			const data = snap.data();
			const video = data?.currentVideo;

			if (!video) return;

			setVideoState({
				url: video.url,
				playing: video.playing,
				timestamp: video.timestamp,
				lastUpdate: video.lastUpdate?.toDate?.() ?? new Date(),
				forcedBy: video.forcedBy,
			});
		});
		return () => unsub();
	}, [roomId]);

	const updateVideoState = async (newState: Partial<VideoState>) => {
		const roomRef = doc(db, 'rooms', roomId);
		await updateDoc(roomRef, {
			currentVideo: {
				...videoState,
				...newState,
				lastUpdate: serverTimestamp(),
			},
		});
	};

	const forceNewVideo = async (url: string, userId: string) => {
		const roomRef = doc(db, 'rooms', roomId);
		await updateDoc(roomRef, {
			currentVideo: {
				url,
				playing: true,
				timestamp: 0,
				lastUpdate: serverTimestamp(),
				forcedBy: userId,
			},
		});
	};

	return {
		videoState,
		updateVideoState,
		forceNewVideo,
	};
}
