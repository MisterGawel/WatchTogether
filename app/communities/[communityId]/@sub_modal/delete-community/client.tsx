'use client';

import { Button } from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal';
import { useRouter } from 'next/navigation';
import { db } from '@/app/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

export default function DeleteCommunityClient({
	communityId,
}: {
	communityId: string;
}) {
	const router = useRouter();
	const handleDeleteCommunity = async () => {
		try {
			const communityDocRef = doc(db, 'communities', communityId);
			const communityDocSnapshot = await getDoc(communityDocRef);

			if (communityDocSnapshot.exists()) {
				const currentRooms = communityDocSnapshot.data().rooms || [];

				for (const roomId of currentRooms) {
					const roomDocRef = doc(db, 'rooms', roomId);
					await deleteDoc(roomDocRef);
				}

				await deleteDoc(communityDocRef);
				router.push('/communities');
			} else {
				console.log("Le document de la communauté n'existe pas !");
			}
		} catch (error) {
			console.error(
				'Erreur lors de la suppression de la communauté :',
				error
			);
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
					Êtes-vous sûr de vouloir supprimer cette communauté
				</ModalHeader>
				<ModalBody className="flex flex-row items-center justify-end w-full pb-8">
					<Button
						onPress={() => {
							router.push('/communities');
						}}
						className="w-fit"
						color="primary"
					>
						Annuler
					</Button>
					<Button
						onPress={handleDeleteCommunity}
						className="w-fit"
						color="danger"
					>
						Supprimer la communauté
					</Button>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
