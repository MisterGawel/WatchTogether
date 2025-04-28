'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@heroui/react';
import { motion } from 'framer-motion';
import { db, auth } from '@/app/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import {
	Modal,
	ModalContent,
	ModalHeader,
	useDisclosure,
	ModalBody,
} from '@heroui/modal';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export default function AllCommunitiesModal() {
	const [loading, setLoading] = useState(true);
	const [communities, setCommunities] = useState<
		{ id: string; name?: string; description?: string }[]
	>([]);
	const [user, setUser] = useState<User | null>(null);
	const router = useRouter();
	const { onOpenChange } = useDisclosure();

	const fetchCommunities = async () => {
		setLoading(true);
		const querySnapshot = await getDocs(collection(db, 'communities'));
		const communities = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		setCommunities(communities);
		setLoading(false);
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				setUser(currentUser);
			} else {
				setUser(null);
			}
		});
		return () => unsubscribe();
	}, []);

	useEffect(() => {
		fetchCommunities();
	}, []);

	const joinCommunity = async (communityId: string) => {
		if (user) {
			const userRef = doc(db, 'users', user.uid);
			await updateDoc(userRef, {
				[`communities.${communityId}`]: 'member',
			});

			router.push(`/communities/${communityId}`);
		}
	};

	if (loading) {
		return (
			<Modal defaultOpen={true} size="5xl" onOpenChange={onOpenChange}>
				<ModalContent>
					{() => (
						<>
							<ModalHeader>Mes communautés</ModalHeader>
							<ModalBody className="flex items-center justify-center max-h-[80vh] min-h-[80vh]">
								<div className="flex flex-col items-center space-y-2">
									<Loader2
										className="w-8 h-8 animate-spin"
										aria-hidden="true"
									/>
									<span className="text-gray-500">
										Chargement des communautés…
									</span>
									<span className="sr-only">
										Chargement en cours
									</span>
								</div>
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>
		);
	} else
		return (
			<>
				<Modal
					defaultOpen={true}
					size="5xl"
					onOpenChange={(open) => {
						if (!open) {
							router.push('/communities');
						}
						onOpenChange();
					}}
				>
					<ModalContent>
						{() => (
							<>
								<ModalHeader>
									Toutes les communautés
								</ModalHeader>
								<ModalBody className="max-h-[80vh] py-[2rem] overflow-y-auto">
									{communities && communities.length > 0 && (
										<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
											{communities.map((commu, index) => (
												<motion.div
													key={commu.id}
													initial={{
														opacity: 0,
														y: 10,
													}}
													animate={{
														opacity: 1,
														y: 0,
													}}
													transition={{
														delay: index * 0.025,
														duration: 0.3,
														ease: 'easeOut',
													}}
													onClick={() =>
														joinCommunity(commu.id)
													}
												>
													<Card className="p-6 transition-all duration-300 border border-gray-200 shadow-sm cursor-pointer min-h-32 rounded-2xl hover:shadow-lg hover:border-gray-300">
														<h2 className="text-2xl font-semibold text-primary">
															{commu.name}
														</h2>
														<p className="mt-2 text-sm text-gray-600 line-clamp-3">
															{commu.description}
														</p>
													</Card>
												</motion.div>
											))}
										</div>
									)}
								</ModalBody>
							</>
						)}
					</ModalContent>
				</Modal>
			</>
		);
}
