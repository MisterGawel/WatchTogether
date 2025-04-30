'use client';
import { MdDelete } from 'react-icons/md';
import { BsFillArrowRightCircleFill } from 'react-icons/bs';
import { FaUsers } from 'react-icons/fa';
import { Card, CardHeader, CardBody, Image, Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/app/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function CardRoom({ role, room, communityId }) {
	const image = 'https://heroui.com/images/hero-card-complete.jpeg';
	const router = useRouter();
	console.log(room);
	const [nbMembreRoom, setNbMembreRoom] = useState(0);

	useEffect(() => {
		if (!room?.id) return;

		const presenceRef = collection(db, 'presence');
		const q = query(presenceRef, where('roomId', '==', room.id));

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const now = Date.now();
			const THRESHOLD = 30_000; // 30 secondes

			const activeUsers = snapshot.docs.filter((doc) => {
				const data = doc.data();
				return now - data.lastSeen < THRESHOLD;
			});

			setNbMembreRoom(activeUsers.length);
		});

		return () => unsubscribe();
	}, [room.id]);

	return (
		<div className="flex flex-col items-start">
			<Card className="w-full shadow-none cursor-pointer bg-background">
				<CardBody className="flex flex-row items-center justify-between gap-4 px-4 py-2 overflow-visible">
					<div className="flex items-center gap-4">
						<Image
							src={image}
							alt="Salle"
							className="object-cover rounded-xl"
							width={50}
							height={50}
						/>
						<h4 className="text-lg font-bold">{room.name}</h4>{' '}
					</div>
					<div className="flex items-center gap-5">
						<div className="flex items-center gap-2 text-gray-500">
							<span className="text-sm font-medium">{nbMembreRoom}</span>
							<FaUsers />
						</div>
						<div className="flex items-center gap-2 text-gray-500">
							<Button
								color="primary"
								isIconOnly
								size="md"
								onPress={() => {
									router.push(`/rooms/new/${room.id}`);
								}}
							>
								<BsFillArrowRightCircleFill className="text-xl" />
							</Button>
							{role === 'admin' && (
								<Button
									onPress={() => {
										router.push(
											`/communities/${communityId}/delete-room/${room.id}`
										);
									}}
									color="danger"
									isIconOnly
									size="md"
								>
									<MdDelete className="text-2xl" />
								</Button>
							)}
						</div>
					</div>
				</CardBody>
			</Card>
		</div>
	);
}
