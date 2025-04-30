'use client';

import { collection, getDocs } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Card } from '@heroui/react';
import { Button } from '@heroui/button';
import { db } from '../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Chip } from '@heroui/chip';

const getUsersInCommunity = async (communityId) => {
	const usersRef = collection(db, 'users');
	const snapshot = await getDocs(usersRef);

	const usersInCommunity = [];

	snapshot.forEach((docSnap) => {
		const userData = docSnap.data();
		if (userData.communities && userData.communities[communityId]) {
			usersInCommunity.push({ id: docSnap.id, ...userData });
		}
	});

	return usersInCommunity;
};

export default function CommunityMembers({ communityId, Role }) {
	const [members, setMembers] = useState([]);
	const [loading, setLoading] = useState(true);

	const fetchMembers = async () => {
		const users = await getUsersInCommunity(communityId);
		setMembers(users);
		setLoading(false);
	};

	useEffect(() => {
		if (communityId) {
			fetchMembers();
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [communityId]);

	const promoteToAdmin = async (userId) => {
		const userRef = doc(db, 'users', userId);
		const userSnapshot = await getDoc(userRef);

		if (!userSnapshot.exists()) return;

		const userData = userSnapshot.data();
		const updatedCommunities = {
			...userData.communities,
			[communityId]: 'admin',
		};

		await updateDoc(userRef, {
			communities: updatedCommunities,
		});

		// Refresh members list after promotion
		fetchMembers();
	};

	if (loading) {
		return (
			<div className="mt-10 text-center">Chargement des membres...</div>
		);
	}

	if (members.length === 0) {
		return <div className="mt-10 text-center">Aucun membre trouvé.</div>;
	}

	return (
		<div className="w-full p-6 overflow-y-auto bg-white border-2 border-gray-100 shadow-sm rounded-xl">
			<h2 className="mb-4 text-xl font-bold">Membres</h2>
			<div className="flex flex-col gap-4">
				{members.map((member) => (
					<Card
						key={member.id}
						className="px-4 py-2.5 bg-background shadow-none"
					>
						<div className="flex items-center justify-between gap-4">
							<h2 className="text-base font-medium">
								{member.name || 'Utilisateur inconnu'}
							</h2>
							<Chip
								className={`${member.communities?.[communityId] === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-300 text-gray-800'} font-bold rounded-lg`}
								size="sm"
							>
								{member.communities?.[communityId] === 'admin'
									? 'Admin'
									: 'Membre'}
							</Chip>
						</div>

						{/* Si moi je suis Admin (Role === 'admin') et que le membre n'est pas admin */}
						{Role === 'admin' &&
							member.communities?.[communityId] !== 'admin' && (
								<Button
									className="mt-4"
									onClick={() => promoteToAdmin(member.id)}
								>
									Promouvoir en Admin
								</Button>
							)}
					</Card>
				))}
			</div>
		</div>
	);
}
