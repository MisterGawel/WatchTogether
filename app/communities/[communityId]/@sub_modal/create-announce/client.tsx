'use client';

import { Button, Textarea } from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { db } from '@/app/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function InputAnnonce({ communityId }: { communityId: string }) {
	const [annonce, setAnnonce] = useState<string>('');

	const addAnnonce = async () => {
		if (annonce.trim() !== '') {
			try {
				const newAnnonceObj = annonce;
				const communityDocRef = doc(db, 'communities', communityId);
				const communityDocSnapshot = await getDoc(communityDocRef);
				if (communityDocSnapshot.exists()) {
					const currentAnnonces =
						communityDocSnapshot.data().announcements || [];
					const updatedAnnonces = [...currentAnnonces, newAnnonceObj];
					await updateDoc(communityDocRef, {
						announcements: updatedAnnonces,
					});
					router.back();
				} else {
					console.log("Le document de la communauté n'existe pas !");
				}
			} catch (error) {
				console.error("Erreur lors de l'ajout de l'annonce :", error);
			}
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
				<ModalHeader>Ajouter une annonce</ModalHeader>
				<ModalBody className="flex items-center justify-center pb-8">
					<Textarea
						minRows={5}
						maxRows={10}
						value={annonce}
						onChange={(e) => setAnnonce(e.target.value)}
						placeholder="Écrire une annonce..."
						className="w-full mt-2"
					/>
					<Button
						onPress={addAnnonce}
						className="mx-auto mt-2 w-fit"
						color="primary"
					>
						Ajouter l&apos;annonce
					</Button>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
