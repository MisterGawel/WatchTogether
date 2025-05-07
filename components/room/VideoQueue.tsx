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
	thumbnail?: string;
	title?: string;
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

	const handleRemove = async (video: VideoItem) => {
		await deleteDoc(doc(db, `rooms/${roomId}/wait_links/${video.id}`));
	};
	  

	return (
		<div className="px-4 pb-4 space-y-4 grow">
			{queue.length === 0 ? (
				<p className="mt-8 text-center text-gray-500">
					Aucune vidéo en attente.
				</p>
			) : (
				queue.map((video) => (
					<div
						key={video.id}
						className="flex items-center gap-4 transition-shadow rounded-lg"
					>
						{/* Thumbnail si dispo */}
						{video.thumbnail ? (
							<img
								src={video.thumbnail}
								alt={video.text}
								className="flex-shrink-0 object-cover w-16 h-16 rounded-md"
							/>
						) : (
							<div className="flex items-center justify-center w-16 h-16 text-xl text-gray-400 bg-gray-200 rounded-md">
								🎬
							</div>
						)}

						{/* Infos vidéo */}
						<div className="flex flex-col flex-1 overflow-hidden">
							<p className="text-sm font-medium truncate sm:text-base">
								{video.title || video.text}
							</p>
							<p className="mt-1 text-xs text-gray-500">
								Ajouté par {video.user}
							</p>
						</div>

						{/* Action */}
						{isAdmin && (
							<div className="flex gap-2 ml-auto">
								<Button
								size="sm"
								color="primary"
								onPress={() => handleForcePlay(video)}
								className="hover:shadow-none"
								>
								Lire
								</Button>
								<Button size="sm" color="danger" onClick={() => handleRemove(video)}>🗑️</Button>
							</div>
							)}

					</div>
				))
			)}
		</div>
	);
}
