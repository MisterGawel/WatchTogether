'use client';

import { Button, Input } from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createRoom } from '@/lib/createRoom';

export default function CreateRoomClient({
	communityId,
}: {
	communityId: string;
}) {
	const [roomName, setRoomName] = useState<string>('');

	const handleSubmit = async () => {
		if (!roomName.trim()) {
			alert('Veuillez entrer un nom de salle');
			return;
		}

		try {
			const roomId = await createRoom(roomName, communityId, '1');
			router.push(`/rooms/${roomId}`);
		} catch (error) {
			console.error('Erreur création room:', error);
			alert('Erreur lors de la création de la salle');
		}
	};

	const router = useRouter();
	return (
		<Modal
			defaultOpen={true}
			onOpenChange={() => {
				router.push('/communities/' + communityId);
			}}
		>
			<ModalContent>
				<ModalHeader>Créer une room</ModalHeader>
				<ModalBody className="flex items-center justify-center pb-8">
					<Input
						value={roomName}
						onChange={(e) => setRoomName(e.target.value)}
						placeholder="Nom room"
						className="w-full mt-2"
					/>
					<Button
						onPress={handleSubmit}
						className="mx-auto mt-2 w-fit"
						color="primary"
					>
						Créer la room
					</Button>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
