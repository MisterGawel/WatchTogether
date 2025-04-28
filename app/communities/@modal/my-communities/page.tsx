'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@heroui/react';
import { motion } from 'framer-motion';
import { db, auth } from '@/app/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
	Modal,
	ModalContent,
	ModalHeader,
	useDisclosure,
	ModalBody,
} from '@heroui/modal';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AllCommunitiesModal() {
	const [loading, setLoading] = useState(false);
	const [communities, setCommunities] = useState<
		{ id: string; name?: string; description?: string }[]
	>([]);
	const [userCommunities, setUserCommunities] = useState<
		Record<string, string>
	>({});
	const router = useRouter();
	const { onOpenChange } = useDisclosure();
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				const userRef = doc(db, 'users', currentUser.uid);
				getDoc(userRef).then((docSnap) => {
					if (docSnap.exists()) {
						setUserCommunities(docSnap.data().communities || {});
					}
				});
			} else {
				setUserCommunities({});
			}
		});
		return () => unsubscribe();
	}, []);

	useEffect(() => {
		fetchCommunities();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userCommunities]);

	const fetchCommunities = async () => {
		setLoading(true);
		const querySnapshot = await getDocs(collection(db, 'communities'));
		const communities = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		const userCommunitiesList = communities.filter(
			(commu) => userCommunities[commu.id]
		);

		setCommunities(userCommunitiesList);
		setLoading(false);
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
					onOpenChange={onOpenChange}
				>
					<ModalContent>
						{() => (
							<>
								<ModalHeader>Mes communautés</ModalHeader>
								<ModalBody className="max-h-[80vh] min-h-[80vh] py-[2rem] overflow-y-auto">
									{communities && communities.length > 0 && (
										<div className="mb-8">
											<div className="grid gap-6 mx-auto md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
												{communities.map(
													(commu, index) => (
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
																delay:
																	index *
																	0.025,
																duration: 0.3,
																ease: 'easeOut',
															}}
															onClick={() =>
																router.push(
																	`/communities/${commu.id}`
																)
															}
														>
															<Card className="p-6 transition-all duration-300 border border-gray-200 shadow-sm cursor-pointer min-h-32 rounded-2xl hover:shadow-lg hover:border-gray-300">
																<h2 className="text-2xl font-semibold text-primary">
																	{commu.name}
																</h2>
																<p className="mt-2 text-sm text-gray-600 line-clamp-3">
																	{
																		commu.description
																	}
																</p>
															</Card>
														</motion.div>
													)
												)}
											</div>
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
