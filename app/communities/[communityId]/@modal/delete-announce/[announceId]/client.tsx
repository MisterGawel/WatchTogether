'use client';

import { Button } from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal';
import { useRouter } from 'next/navigation';
import { db } from '@/app/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function DeleteRoomClient({
	communityId,
	index,
}: {
	communityId: string;
	index?: number;
}) {
	const router = useRouter();
	const handleDeleteAnnounce = async () => {
		try {
			const communityDocRef = doc(db, 'communities', communityId);
			const communityDocSnapshot = await getDoc(communityDocRef);
			if (communityDocSnapshot.exists()) {
				const currentAnnonces =
					communityDocSnapshot.data().announcements;
				if (
					index !== undefined &&
					index >= 0 &&
					index < currentAnnonces.length
				) {
					const updatedAnnonces = currentAnnonces.filter(
						(_, idx) => idx !== index
					);
					await updateDoc(communityDocRef, {
						announcements: updatedAnnonces,
					});
					router.back();
				} else {
					console.log("Index d'annonce invalide !", index);
				}
			} else {
				console.log("Le document de la communauté n'existe pas !");
			}
		} catch (error) {
			console.error(
				"Erreur lors de la suppression de l'annonce :",
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
					Êtes-vous sûr de vouloir supprimer cette annonce ?
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
						onPress={handleDeleteAnnounce}
						className="w-fit"
						color="danger"
					>
						Supprimer l&apos;annonce
					</Button>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
