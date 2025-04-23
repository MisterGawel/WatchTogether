'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@heroui/react';
import { Button } from '@heroui/button';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import CommunitySpace from './EspaceCommu';
import CreateCommunity from './CreateCommunity';

export default function CommunityListPage() {
	const [communities, setCommunities] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedCommunityId, setSelectedCommunityId] = useState(null);

	useEffect(() => {
		fetchCommunities();
	}, []);

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
					<div className="grid gap-6 mx-auto md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
						{communities.map((commu, index) => (
							<motion.div
								key={commu.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									delay: index * 0.025,
									duration: 0.3,
									ease: 'easeOut',
								}}
								onClick={() => setSelectedCommunityId(commu.id)}
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
			</div>
		);
	}
}
