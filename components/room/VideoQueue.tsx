// components/room/VideoQueue.tsx
'use client';

import { useEffect, useState } from 'react';
import {
	collection,
	onSnapshot,
	addDoc,
	deleteDoc,
	doc,
} from 'firebase/firestore';
import { db } from '@/app/firebase';
import { Button } from '@heroui/button';
import { useSyncedVideo } from './useSyncedVideo';

type VideoItem = {
	id: string;
	text: string;
	user: string;
};

type Props = {
	roomId: string;
	currentUserId: string;
	isAdmin: boolean;
};

export default function VideoQueue({ roomId, currentUserId, isAdmin }: Props) {
	const [queue, setQueue] = useState<VideoItem[]>([]);
	const { forceNewVideo } = useSyncedVideo(roomId);

	useEffect(() => {
		const ref = collection(db, `rooms/${roomId}/wait_links`);
		const unsub = onSnapshot(ref, (snap) => {
			const data = snap.docs.map((doc) => ({
				id: doc.id,
				...(doc.data() as any),
			}));
			setQueue(data);
		});
		return () => unsub();
	}, [roomId]);

	const handleForcePlay = async (video: VideoItem) => {
		await forceNewVideo(video.text, currentUserId);
		await deleteDoc(doc(db, `rooms/${roomId}/wait_links/${video.id}`));
	};

	return (
		<div className="p-4 space-y-2">
			<h2 className="text-lg font-bold">File d’attente</h2>
			{queue.length === 0 ? (
				<p className="text-gray-500">Aucune vidéo en attente.</p>
			) : (
				queue.map((video) => (
					<div key={video.id} className="p-2 border rounded flex justify-between items-center">
						<div>
							<p className="font-medium">{video.text}</p>
							<p className="text-sm text-gray-500">par {video.user}</p>
						</div>
						{isAdmin && (
							<Button
								size="sm"
								color="primary"
								onPress={() => handleForcePlay(video)}
							>
								Lire
							</Button>
						)}
					</div>
				))
			)}
		</div>
	);
}
