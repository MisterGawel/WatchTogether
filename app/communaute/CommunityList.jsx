'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@heroui/react';
import { Button } from '@heroui/button';
import { motion } from 'framer-motion';
import { db, auth } from '../firebase';
import {
	collection,
	getDocs,
	doc,
	getDoc,
	updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // Pour vérifier l'utilisateur connect
import CommunitySpace from './EspaceCommu';
import CreateCommunity from './CreateCommunity';

export default function CommunityListPage() {
	const [communities, setCommunities] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedCommunityId, setSelectedCommunityId] = useState(null);
	const [user, setUser] = useState(null); // L'utilisateur connecté
	const [userCommunities, setUserCommunities] = useState({});
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				setUser(currentUser);
				const userRef = doc(db, 'users', currentUser.uid);
				getDoc(userRef).then((docSnap) => {
					if (docSnap.exists()) {
						setUserCommunities(docSnap.data().communities || {});
					}
				});
			} else {
				setUser(null);
				setUserCommunities({});
			}
		});
		return () => unsubscribe();
	}, []);
	useEffect(() => {
		fetchCommunities();
	}, [userCommunities]);

	const fetchCommunities = async () => {
		console.log('User communauté : ', userCommunities);
		setLoading(true);
		const querySnapshot = await getDocs(collection(db, 'communities'));
		const communities = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));
		// Séparer les communautés de l'utilisateur et les autres
		const userCommunitiesList = communities.filter(
			(commu) => userCommunities[commu.id]
		);
		const otherCommunitiesList = communities.filter(
			(commu) => !userCommunities[commu.id]
		);

		setCommunities({
			userCommunities: userCommunitiesList,
			otherCommunities: otherCommunitiesList,
		});
		setLoading(false);
		setLoading(false);
	};

	// Fonction pour rejoindre une communauté
	const joinCommunity = async (communityId) => {
		if (user) {
			// Ajouter l'utilisateur à la communauté
			const userRef = doc(db, 'users', user.uid);
			await updateDoc(userRef, {
				[`communities.${communityId}`]: 'member', // Assigner un rôle de membre à l'utilisateur pour cette communauté
			});

			// Mettre à jour l'état des communautés de l'utilisateur
			setUserCommunities((prevCommunities) => ({
				...prevCommunities,
				[communityId]: 'member',
			}));
			setSelectedCommunityId(communityId);
			// Recharger les communautés
			fetchCommunities();
		}
	};
	if (selectedCommunityId) {
		return (
			<div className="p-4">
				<Button
					onPress={() => setSelectedCommunityId(null)}
					className="mb-4"
				>
					← Retour aux communautés
				</Button>
				<CommunitySpace Room={selectedCommunityId} />
			</div>
		);
	} else {
		return (
			<div className="min-h-screen px-4 py-10 bg-gray-50">
				<div className="flex items-center justify-between mx-auto mb-10 max-w-7xl">
					<h1 className="text-4xl font-bold text-gray-800">
						Communautés
					</h1>
					<CreateCommunity onCreated={fetchCommunities} />
				</div>

				{loading ? (
					<div className="flex justify-center mt-20">
						<div className="text-center">
							<div className="w-12 h-12 mx-auto mb-4 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
							<p className="text-gray-600">
								Chargement des communautés...
							</p>
						</div>
					</div>
				) : (
					<div>
						{/* Section des communautés de l'utilisateur */}
						{communities.userCommunities &&
							communities.userCommunities.length > 0 && (
								<div className="mb-8">
									<h2 className="mb-4 text-2xl font-semibold text-gray-800">
										Mes communautés
									</h2>
									<div className="grid gap-6 mx-auto md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
										{communities.userCommunities.map(
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
														delay: index * 0.025,
														duration: 0.3,
														ease: 'easeOut',
													}}
													onClick={() =>
														setSelectedCommunityId(
															commu.id
														)
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
											)
										)}
									</div>
								</div>
							)}

						{/* Section des autres communautés */}
						{communities.otherCommunities &&
							communities.otherCommunities.length > 0 && (
								<div>
									<h2 className="mb-4 text-2xl font-semibold text-gray-800">
										Autres communautés
									</h2>
									<div className="grid gap-6 mx-auto md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
										{communities.otherCommunities.map(
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
											)
										)}
									</div>
								</div>
							)}
					</div>
				)}
			</div>
		);
	}
}
