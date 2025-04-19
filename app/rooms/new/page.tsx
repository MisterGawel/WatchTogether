"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../../firebase"; // 🔥 Import Firestore et auth
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { createRoom } from "./roomService";

export default function Page() {
    const [roomName, setRoomName] = useState("");
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Gestion de l'authentification
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
            
            // Rediriger si non connecté
            if (!user) {
                router.push("/login"); // Adaptez cette route selon votre configuration
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) {
            alert("Vous devez être connecté pour créer une room");
            return;
        }

        try {
            const communityID = "UIyd1HlGNJACSPUNP2pl"; // Vous pourriez aussi rendre ceci dynamique
            const roomId = await createRoom(roomName, communityID, currentUser.uid);
            router.push(`/rooms/new/${roomId}`);
        } catch (error) {
            console.error("Erreur lors de la création de la room:", error);
            alert("Une erreur est survenue lors de la création de la room");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96"
            >
                <h1 className="text-xl font-bold text-center mb-4 text-gray-700 dark:text-gray-300">
                    Créer une nouvelle Room
                </h1>
                
                {currentUser && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Connecté en tant que: {currentUser.email || currentUser.uid}
                    </p>
                )}

                <label htmlFor="input" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom de la Room:
                </label>
                <input
                    id="input"
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md 
                    focus:ring-2 focus:ring-blue-500 focus:outline-none text-black dark:text-white
                    bg-white dark:bg-gray-700"
                    placeholder="Entrez le nom de la room"
                    required
                />
                
                <button
                    type="submit"
                    className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition
                    disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!currentUser}
                >
                    Créer la Room
                </button>

                {!currentUser && (
                    <p className="mt-2 text-sm text-red-500">
                        Vous devez être connecté pour créer une room
                    </p>
                )}
            </form>
        </div>
    );
}