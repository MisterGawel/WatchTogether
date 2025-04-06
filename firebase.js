import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';

// Configuration Firebase
const firebaseConfig = {

	apiKey: "AIzaSyD1ykPx6lritVN81q3mC4ayLHywfA_OM9M",
  
	authDomain: "watchtogamer.firebaseapp.com",
  
	databaseURL: "https://watchtogamer-default-rtdb.europe-west1.firebasedatabase.app",
  
	projectId: "watchtogamer",
  
	storageBucket: "watchtogamer.firebasestorage.app",
  
	messagingSenderId: "664072514206",
  
	appId: "1:664072514206:web:2a3a997f2a1722913da98f",
  
	measurementId: "G-3Y4BBRJLMR"
  
  };
  
  

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // 🔥 Ajout de Firestore
const auth = getAuth(app);
//const analytics = typeof window !== "undefined" ? getAnalytics(app) : null; // Empêcher erreur en SSR

export { app, db,auth };
