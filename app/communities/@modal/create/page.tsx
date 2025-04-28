'use client';

import { useState } from 'react';
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalFooter,
	useDisclosure,
	ModalBody,
} from '@heroui/modal';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/app/firebase';
import { useRouter } from 'next/navigation';

export default function CreateCommunity({
	onCreated,
}: {
	onCreated: () => void;
}) {
	const [name, setName] = useState('');
	const [desc, setDesc] = useState('');
	const [loading, setLoading] = useState(false);

	const router = useRouter();

	const { onOpenChange } = useDisclosure();

	const handleCreateCommunity = async () => {
		if (!name.trim()) return;

		const currentUser = auth.currentUser;
		if (!currentUser) {
			console.error('Aucun utilisateur connecté.');
			return;
		}

		setLoading(true);
		try {
			const communityRef = await addDoc(collection(db, 'communities'), {
				name,
				description: desc,
				annonces: [],
				rooms: [],
			});

			const userRef = doc(db, 'users', currentUser.uid);
			await updateDoc(userRef, {
				[`communities.${communityRef.id}`]: 'admin',
			});

			setName('');
			setDesc('');
			setLoading(false);
			onCreated();
			router.push(`/communities/${communityRef.id}`);
		} catch (error) {
			console.error('Erreur lors de la création :', error);
			setLoading(false);
		}
	};

	return (
		<>
			<Modal
				defaultOpen={true}
				onOpenChange={(open) => {
					if (!open) {
						router.push('/communities');
					}
					onOpenChange();
				}}
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>Créer une communauté</ModalHeader>
							<ModalBody>
								<div className="mt-4 space-y-4">
									<Input
										placeholder="Nom de la communauté"
										value={name}
										onChange={(e) =>
											setName(e.target.value)
										}
									/>
									<Input
										placeholder="Description"
										value={desc}
										onChange={(e) =>
											setDesc(e.target.value)
										}
									/>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button
									color="danger"
									variant="light"
									onPress={onClose}
								>
									Annuler
								</Button>
								<Button
									color="primary"
									onPress={handleCreateCommunity}
									isLoading={loading}
								>
									Créer
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
