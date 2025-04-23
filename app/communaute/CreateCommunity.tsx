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
import { addDoc, collection,doc,updateDoc } from 'firebase/firestore';
import { db ,auth} from '@/app/firebase';

export default function CreateCommunity({
	onCreated,
}: {
	onCreated: () => void;
}) {
	const [name, setName] = useState('');
	const [desc, setDesc] = useState('');
	const [loading, setLoading] = useState(false);

	const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

const handleCreateCommunity = async () => {
		if (!name.trim()) return;

		const currentUser = auth.currentUser;
		if (!currentUser) {
			console.error('Aucun utilisateur connecté.');
			return;
		}

		setLoading(true);
		try {
			// 1. Crée la communauté
			const communityRef = await addDoc(collection(db, 'communities'), {
				name,
				description: desc,
				annonces: [],
				rooms: [],
			});

			// 2. Ajoute l'utilisateur en tant qu'admin dans son profil
			const userRef = doc(db, 'users', currentUser.uid);
			await updateDoc(userRef, {
				[`communities.${communityRef.id}`]: 'admin',
			});

			// 3. Reset & callbacks
			setName('');
			setDesc('');
			setLoading(false);
			onClose();
			onCreated();
		} catch (error) {
			console.error('Erreur lors de la création :', error);
			setLoading(false);
		}
	};

	return (
		<>
			<Button
				onPress={onOpen}
				className="bg-primary text-primary-foreground"
			>
				Créer une communauté
			</Button>
			<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
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
