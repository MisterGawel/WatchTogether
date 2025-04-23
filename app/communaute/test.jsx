import { collection, getDocs } from 'firebase/firestore';

async function checkFirestoreData() {
	const annoncesRef = collection(
		db,
		'communities',
		'VmcNk4sdbnp5Y1NoSeH5',
		'announcements'
	);
	const sallesRef = collection(
		db,
		'communities',
		'VmcNk4sdbnp5Y1NoSeH5',
		'rooms'
	);

	const annoncesSnapshot = await getDocs(annoncesRef);
	const sallesSnapshot = await getDocs(sallesRef);

	console.log(
		'Annonces :',
		annoncesSnapshot.docs.map((doc) => doc.data())
	);
	console.log(
		'Salles :',
		sallesSnapshot.docs.map((doc) => doc.data())
	);
}

checkFirestoreData();
