// app/CommunityListPage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CommunityDashboard } from './CommunityDashboard';
import type { User } from 'firebase/auth';

type Community = {
	id: string;
	name: string;
	description?: string;
	[key: string]: string | number | boolean | undefined;
};

type UserCommunitiesMap = {
	[communityId: string]: 'admin' | 'member' | undefined;
};

export default function CommunityListPage() {
	const [communities, setCommunities] = useState<{
		userCommunities: Community[];
		otherCommunities: Community[];
	}>({ userCommunities: [], otherCommunities: [] });
	const [user, setUser] = useState<User | null>(null);
	const [userCommunitiesMap, setUserCommunitiesMap] = useState<
		Record<string, UserCommunitiesMap>
	>({});

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userCommunitiesMap]);

	const fetchCommunities = async () => {
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
	};

	return (
		<div className="flex items-center justify-center min-h-screen px-4 py-10 bg-gray-50">
			<CommunityDashboard
				user={user}
				totalCount={
					communities.userCommunities.length +
					communities.otherCommunities.length
				}
				userCount={communities.userCommunities.length}
			/>
		</div>
	);
}
