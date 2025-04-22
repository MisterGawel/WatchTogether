'use client';

import React, { useEffect, useState } from 'react';
import { db,auth } from '@/app/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
	collection,
	getDocs,
	addDoc,
	doc,
	updateDoc,
} from 'firebase/firestore';
import { Card } from '@heroui/react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { motion } from 'framer-motion';
import CommunitySpace from './EspaceCommu'; // adapte le chemin

export default function CommunityListPage() {
	const [communities, setCommunities] = useState([]);
	const [selectedCommunityId, setSelectedCommunityId] = useState(null);
	const [showForm, setShowForm] = useState(false);
	const [newName, setNewName] = useState('');
	const [newDesc, setNewDesc] = useState('');

	useEffect(() => {
		fetchCommunities();
	}, []);

	const fetchCommunities = async () => {
		try {
			const querySnapshot = await getDocs(collection(db, 'communities'));
			const data = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			setCommunities(data);
		} catch (error) {
			console.error('Erreur lors du chargement des communautés :', error);
		}
	};

	const handleCreateCommunity = async () => {
		if (!newName.trim()) return;
	
		const currentUser = auth.currentUser;
		if (!currentUser) {
			console.error('Aucun utilisateur connecté.');
			return;
		}
	
		try {
			// 1. Créer la communauté
			const communityRef = await addDoc(collection(db, 'communities'), {
				name: newName,
				description: newDesc,
				annonces: [],
				rooms: [],
			});
	
			// 2. Ajouter l'utilisateur actuel comme admin dans son doc
			const userRef = doc(db, 'users', currentUser.uid);
			await updateDoc(userRef, {
				[`communities.${communityRef.id}`]: 'admin',
			});
	
			// 3. Reset form + rechargement
			setNewName('');
			setNewDesc('');
			setShowForm(false);
			fetchCommunities();
		} catch (error) {
			console.error('Erreur lors de la création :', error);
		}
	};

	if (selectedCommunityId) {
		return (
			<div className="p-4">
				<Button onPress={() => setSelectedCommunityId(null)} className="mb-4">
					← Retour aux communautés
				</Button>
				<CommunitySpace Room={selectedCommunityId} />
			</div>
		);
	}

	return (
		<div className="min-h-screen px-4 py-10 bg-gray-50">
			<div className="flex items-center justify-between mb-10 max-w-7xl mx-auto">
				<h1 className="text-4xl font-bold text-gray-800">Communautés</h1>
				<Button onPress={() => setShowForm(!showForm)} className="bg-indigo-600 text-white">
					Créer une communauté
				</Button>
			</div>

			{showForm && (
				<div className="max-w-3xl p-4 mx-auto mb-10 bg-white border rounded-xl shadow-md space-y-4">
					<h2 className="text-2xl font-semibold text-gray-700">Nouvelle Communauté</h2>
					<Input
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder="Nom de la communauté"
					/>
					<Input
						value={newDesc}
						onChange={(e) => setNewDesc(e.target.value)}
						placeholder="Description"
					/>
					<Button onPress={handleCreateCommunity} className="bg-indigo-600 text-white">
						Créer
					</Button>
				</div>
			)}

			<div className="grid gap-6 mx-auto md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
				{communities.map((commu, index) => (
					<motion.div
						key={commu.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
					>
						<Card className="rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 p-6">
							<h2 className="text-2xl font-semibold text-indigo-600">
								{commu.name}
							</h2>
							<p className="mt-2 text-sm text-gray-600 line-clamp-3">
								{commu.description}
							</p>
							<Button
								variant="ghost"
								className="mt-4 text-indigo-600 hover:underline"
								onPress={() => setSelectedCommunityId(commu.id)}
							>
								Explorer
							</Button>
						</Card>
					</motion.div>
				))}
			</div>
		</div>
	);
}
