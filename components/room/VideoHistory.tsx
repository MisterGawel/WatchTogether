// components/room/VideoHistory.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/firebase';

type Video = {
	id: string;
	text: string;
	user: string;
	timestamp: any;
	thumbnail?: string;
	title?: string;
};

export default function VideoHistory({ roomId }: { roomId: string }) {
	const [history, setHistory] = useState<Video[]>([]);

	useEffect(() => {
		const ref = collection(db, `rooms/${roomId}/history`);
		const unsub = onSnapshot(ref, (snap) => {
			const data = snap.docs.map((doc) => ({
				id: doc.id,
				...(doc.data() as any),
			}));
			setHistory(data);
		});
		return () => unsub();
	}, [roomId]);

	return (
		<div className="p-4 space-y-4 grow">
			{history.length === 0 ? (
				<p className="text-gray-500">Aucune vidéo visionnée.</p>
			) : (
				history.map((video) => (
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
								🎞️
							</div>
						)}

						{/* Infos vidéo */}
						<div className="flex flex-col overflow-hidden">
							<p className="text-sm font-medium truncate sm:text-base">
								{video.title || video.text}
							</p>
							<p className="mt-1 text-xs text-gray-500">
								Visionné par {video.user}
							</p>
						</div>
					</div>
				))
			)}
		</div>
	);
}
