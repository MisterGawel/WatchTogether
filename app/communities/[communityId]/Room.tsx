'use client';
import { MdDelete } from 'react-icons/md';
import { BsFillArrowRightCircleFill } from 'react-icons/bs';
import { FaUsers } from 'react-icons/fa';
import { Card, CardHeader, CardBody, Image, Button } from '@heroui/react';
import { useRouter } from 'next/navigation';

export default function CardRoom({ role, room, communityId }) {
	const image = 'https://heroui.com/images/hero-card-complete.jpeg';
	const router = useRouter();

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
							<span className="text-sm font-medium">45</span>
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
