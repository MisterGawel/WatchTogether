'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@heroui/react';
import { motion } from 'framer-motion';
import { db, auth } from '@/app/firebase';
import {
	collection,
	getDocs,
	doc,
	updateDoc,
	getDoc,
} from 'firebase/firestore';
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
	const [userCommunities, setUserCommunities] = useState<
		Record<string, string>
	>({});
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
				const userRef = doc(db, 'users', currentUser.uid);
				getDoc(userRef).then((docSnap) => {
					if (docSnap.exists()) {
						setUserCommunities(docSnap.data().communities || {});
					}
				});
				setUser(currentUser);
			} else {
				setUserCommunities({});
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

	const sortedCommunities = [...communities].sort((a, b) => {
		const aIsMember = !!userCommunities[a.id];
		const bIsMember = !!userCommunities[b.id];
		return Number(aIsMember) - Number(bIsMember);
	});

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
				<Modal defaultOpen={true} size="5xl">
					<ModalContent>
						{() => (
							<>
								<ModalHeader>
									Toutes les communautés
								</ModalHeader>
								<ModalBody className="max-h-[80vh] py-[2rem] overflow-y-auto">
									{communities && communities.length > 0 && (
										<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
											{sortedCommunities.map(
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
																index * 0.025,
															duration: 0.3,
															ease: 'easeOut',
														}}
														onClick={() =>
															userCommunities[
																commu.id
															]
																? router.push(
																		`/communities/${commu.id}`
																	)
																: joinCommunity(
																		commu.id
																	)
														}
													>
														<Card
															className={`relative group p-4 transition-all duration-300 border border-gray-200 shadow-sm cursor-pointer min-h-32 rounded-2xl hover:shadow-lg hover:border-gray-300 ${
																userCommunities[
																	commu.id
																]
																	? 'bg-black bg-opacity-15 opacity-55'
																	: 'bg-background'
															}`}
														>
															{/* Overlay au hover */}
															<div className="absolute inset-0 z-50 flex items-center justify-center text-sm font-medium text-white transition-opacity duration-300 bg-black opacity-0 bg-opacity-70 rounded-2xl group-hover:opacity-100">
																{userCommunities[
																	commu.id
																]
																	? 'Vous êtes déjà dans cette communauté'
																	: 'Cliquez pour rejoindre cette communauté'}
															</div>

															{/* Contenu visible en dessous */}
															<div className="relative z-20">
																<h2 className="text-xl font-semibold text-primary">
																	{commu.name}
																</h2>
																<p className="mt-2 text-sm text-gray-600 line-clamp-3">
																	{
																		commu.description
																	}
																</p>
															</div>
														</Card>
													</motion.div>
												)
											)}
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
