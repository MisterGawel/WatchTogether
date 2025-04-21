'use client';
import { useEffect } from 'react';
import { Button, ButtonGroup } from '@heroui/button';
import ChatCommu from './chat';
import CommunitySpace from './EspaceCommu';
import CommunityListPage from './CommunityList';
import { db, auth } from '@/app/firebase';
import { getDocs, collection } from 'firebase/firestore';
export default function Home() {
	return (
		<div className="">
			<main className="">
			<CommunityListPage></CommunityListPage>
			</main>
		</div>
	);
}
