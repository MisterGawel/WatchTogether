import { db } from '@/app/firebase';
import { collection, getDocs } from 'firebase/firestore';
import CommunityListPage from './CommunityList';

export default async function CommunitiesPage() {
	const querySnapshot = await getDocs(collection(db, 'communities'));
	const communities = querySnapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data(),
	}));

	return <CommunityListPage initialCommunities={communities} />;
}
