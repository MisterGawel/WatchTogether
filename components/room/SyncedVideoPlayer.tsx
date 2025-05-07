// components/room/SyncedVideoPlayer.tsx
'use client';

import ReactPlayer from 'react-player';
import { useEffect, useRef, useState } from 'react';
import { useSyncedVideo } from './useSyncedVideo';

type Props = {
	roomId: string;
	userId: string;
	isAdmin?: boolean;
};

export default function SyncedVideoPlayer({ roomId, userId, isAdmin }: Props) {
	const { videoState, updateVideoState } = useSyncedVideo(roomId);
	const playerRef = useRef<ReactPlayer>(null);
	const [internalSeeking, setInternalSeeking] = useState(false);

	// Calcul de la position réelle de lecture
	const getSyncedTime = () => {
		if (!videoState) return 0;
		const elapsed = (Date.now() - videoState.lastUpdate.getTime()) / 1000;
		return videoState.playing
			? videoState.timestamp + elapsed
			: videoState.timestamp;
	};

	useEffect(() => {
		if (!playerRef.current || !videoState || internalSeeking) return;
		const current = playerRef.current.getCurrentTime();
		const target = getSyncedTime();
		if (Math.abs(current - target) > 1) {
			playerRef.current.seekTo(target);
		}
	}, [videoState]);

	const TOLERANCE = 1.5; // Seuil de désynchronisation en secondes

	const correctDesyncIfNeeded = () => {
		if (!playerRef.current || !videoState) return;
		const current = playerRef.current.getCurrentTime();
		const target = getSyncedTime();
		const desync = Math.abs(current - target);

		if (desync > TOLERANCE) {
			playerRef.current.seekTo(target);
		}
	};

	const handlePlay = () => {
		if (!isAdmin || internalSeeking) {
			correctDesyncIfNeeded();
			return;
		}
		updateVideoState({
			playing: true,
			timestamp: playerRef.current?.getCurrentTime() ?? 0,
		});
	};

	const handlePause = () => {
		if (!isAdmin || internalSeeking) {
			correctDesyncIfNeeded();
			return;
		}
		updateVideoState({
			playing: false,
			timestamp: playerRef.current?.getCurrentTime() ?? 0,
		});
	};

	const handleSeek = (seconds: number) => {
		if (!isAdmin) {
			correctDesyncIfNeeded();
			return;
		}
		setInternalSeeking(true);
		updateVideoState({
			timestamp: seconds,
		});
		setTimeout(() => setInternalSeeking(false), 500);
	};

	const handleEnded = async () => {
		if (!roomId) return;

		const nextVideo = await fetch(`/api/rooms/${roomId}/next-video`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});
		const data = await nextVideo.json();
		if (data.error) {
			console.error('Erreur lors de la lecture de la vidéo suivante:', data.error);
			return;
		}
		if (data.message) {
			console.log(data.message);
			return;
		}
		if (data.success) {
			console.log('Lecture de la vidéo suivante réussie');
		}
		updateVideoState({
			playing: true,
			timestamp: 0,
		});
	};

	if (!videoState?.url) {
		return (
			<div className="flex items-center justify-center py-8 text-center bg-background text-foreground rounded-xl aspect-video">
				Aucune vidéo en cours
			</div>
		);
	}

	return (
		<div className="w-full overflow-hidden bg-black rounded-lg aspect-video">
			<ReactPlayer
				ref={playerRef}
				url={videoState.url}
				playing={videoState.playing}
				muted={true}
				controls
				width="100%"
				height="100%"
				onPlay={handlePlay}
				onPause={handlePause}
				onSeek={handleSeek}
				onEnded={handleEnded}
			/>
		</div>
	);
}
