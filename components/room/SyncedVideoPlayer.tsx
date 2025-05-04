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
		return videoState.playing ? videoState.timestamp + elapsed : videoState.timestamp;
	};

	useEffect(() => {
		if (!playerRef.current || !videoState || internalSeeking) return;
		const current = playerRef.current.getCurrentTime();
		const target = getSyncedTime();
		if (Math.abs(current - target) > 1) {
			playerRef.current.seekTo(target);
		}
	}, [videoState]);

	const handlePlay = () => {
		if (internalSeeking) return;
		updateVideoState({
			playing: true,
			timestamp: playerRef.current?.getCurrentTime() ?? 0,
		});
	};

	const handlePause = () => {
		if (internalSeeking) return;
		updateVideoState({
			playing: false,
			timestamp: playerRef.current?.getCurrentTime() ?? 0,
		});
	};

	const handleSeek = (seconds: number) => {
		setInternalSeeking(true);
		updateVideoState({
			timestamp: seconds,
		});
		setTimeout(() => setInternalSeeking(false), 500);
	};

	if (!videoState?.url) {
		return <div className="text-center py-8 text-gray-500">Aucune vidéo en cours</div>;
	}

	return (
		<div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
			<ReactPlayer
				ref={playerRef}
				url={videoState.url}
				playing={videoState.playing}
				controls
				width="100%"
				height="100%"
				onPlay={handlePlay}
				onPause={handlePause}
				onSeek={handleSeek}
			/>
		</div>
	);
}
