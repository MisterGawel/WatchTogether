// app/CommunityListPage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@heroui/button';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import CommunitySpace from './(community-room)/EspaceCommu';
import { CommunityDashboard } from './CommunityDashboard';

type Community = {
	id: string;
	name: string;
	description?: string;
	[key: string]: any;
};

export default function CommunityListPage() {
	const [communities, setCommunities] = useState<{
		userCommunities: Community[];
		otherCommunities: Community[];
	}>({ userCommunities: [], otherCommunities: [] });
	const [loading, setLoading] = useState(false);
	const [selectedCommunityId, setSelectedCommunityId] = useState<
		string | null
	>(null);
	const [user, setUser] = useState<any>(null);
	const [userCommunitiesMap, setUserCommunitiesMap] = useState<
		Record<string, any>
	>({});

	// Listen auth state & load user's communities map
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			if (currentUser) {
				setUser(currentUser);
				const userRef = doc(db, 'users', currentUser.uid);
				const snap = await getDoc(userRef);
				if (snap.exists()) {
					setUserCommunitiesMap(snap.data().communities || {});
				}
			} else {
				setUser(null);
				setUserCommunitiesMap({});
			}
		});
		return () => unsubscribe();
	}, []);

	useEffect(() => {
		fetchCommunities();
	}, [userCommunitiesMap]);

	const fetchCommunities = async () => {
		setLoading(true);
		const querySnapshot = await getDocs(collection(db, 'communities'));
		const all = querySnapshot.docs.map(
			(d) => ({ id: d.id, ...d.data() }) as Community
		);
		const userList = all.filter((c) => userCommunitiesMap[c.id]);
		const otherList = all.filter((c) => !userCommunitiesMap[c.id]);
		setCommunities({
			userCommunities: userList,
			otherCommunities: otherList,
		});
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
	}

	return (
		<div className="flex items-center justify-center min-h-screen px-4 py-10 bg-gray-50">
			<CommunityDashboard
				totalCount={
					communities.userCommunities.length +
					communities.otherCommunities.length
				}
				userCount={communities.userCommunities.length}
			/>
		</div>
	);
}
