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
		<div className="p-4 space-y-2 grow">
			{history.length === 0 ? (
				<p className="text-gray-500">Aucune vidéo visionnée.</p>
			) : (
				history.map((video) => (
					<div key={video.id} className="p-2 border rounded">
						<p className="font-medium">{video.text}</p>
						<p className="text-sm text-gray-500">
							par {video.user}
						</p>
					</div>
				))
			)}
		</div>
	);
}
