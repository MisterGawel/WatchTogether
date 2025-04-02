// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: 'AIzaSyD1ykPx6lritVN81q3mC4ayLHywfA_OM9M',
	authDomain: 'watchtogamer.firebaseapp.com',
	projectId: 'watchtogamer',
	storageBucket: 'watchtogamer.firebasestorage.app',
	messagingSenderId: '664072514206',
	appId: '1:664072514206:web:2a3a997f2a1722913da98f',
	measurementId: 'G-3Y4BBRJLMR',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };