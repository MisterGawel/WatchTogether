'use client';

import { Button } from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal';
import { useRouter } from 'next/navigation';
import { db } from '@/app/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function DeleteRoomClient({
	communityId,
	roomId,
}: {
	communityId: string;
	roomId: string;
}) {
	const router = useRouter();
	const handleDeleteRoom = async () => {
		try {
			const communityDocRef = doc(db, 'communities', communityId);
			const communityDocSnapshot = await getDoc(communityDocRef);

			if (communityDocSnapshot.exists()) {
				const currentRooms = communityDocSnapshot.data().rooms || [];

				if (currentRooms.includes(roomId)) {
					const roomDocRef = doc(db, 'rooms', roomId);
					await deleteDoc(roomDocRef);
					const updatedRooms: string[] = currentRooms.filter(
						(id: string) => id !== roomId
					);
					await updateDoc(communityDocRef, { rooms: updatedRooms });
					router.push('/communities/' + communityId);
				} else {
					console.log(
						"L'ID de la salle ne se trouve pas dans la communauté !"
					);
				}
			} else {
				console.log("Le document de la communauté n'existe pas !");
			}
		} catch (error) {
			console.error('Erreur lors de la suppression de la salle :', error);
		}
	};

	return (
		<Modal
			defaultOpen={true}
			onOpenChange={() => {
				router.push('/communities/' + communityId);
			}}
		>
			<ModalContent>
				<ModalHeader>
					Êtes-vous sûr de vouloir supprimer cette room ?
				</ModalHeader>
				<ModalBody className="flex flex-row items-center justify-end w-full pb-8">
					<Button
						onPress={() => {
							router.push('/communities/' + communityId);
						}}
						className="w-fit"
						color="primary"
					>
						Annuler
					</Button>
					<Button
						onPress={handleDeleteRoom}
						className="w-fit"
						color="danger"
					>
						Supprimer la room
					</Button>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
