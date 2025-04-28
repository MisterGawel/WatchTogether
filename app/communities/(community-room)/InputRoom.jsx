'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom } from '../../rooms/new/roomService';
import { Card, Button, Input } from '@heroui/react';

export default function InputRoom({ role, commuID }) {
	const [roomName, setRoomName] = useState('');
	const router = useRouter();

	const communityID = commuID;
	const idAdmin = '2'; //je sais ce que c'est

	const handleSubmit = async () => {
		if (!roomName.trim()) {
			alert('Veuillez entrer un nom de salle');
			return;
		}

		try {
			const roomId = await createRoom(roomName, communityID, idAdmin);
			//router.push(`/rooms/new/${roomId}`);
		} catch (error) {
			console.error('Erreur création room:', error);
			alert('Erreur lors de la création de la salle');
		}
	};

	return (
		role === 'admin' && (
			<div className="mb-4">
				<Card className="shadow-lg p-4">
					<h3 className="text-lg font-semibold">Ajouter une Salle</h3>
					<Input
						value={roomName}
						onChange={(e) => setRoomName(e.target.value)}
						placeholder="Nom room"
						className="w-full mt-2"
					/>
					<Button onPress={handleSubmit} className="mt-2 w-full">
						Créer la salle
					</Button>
				</Card>
			</div>
		)
	);
}
