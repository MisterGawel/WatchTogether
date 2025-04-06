"use client";

import { useEffect, useState } from "react";
import { db } from "../../../../firebase";
import { doc, getDoc,deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// ID utilisateur courant (à remplacer par système d'authentification)
const CURRENT_USER_ID = "2"; 





export default function RoomPage({ params }: { params: Promise<any> }) {
    const [roomData, setRoomData] = useState<{
        name: string;
        community: string;
        admin: string; 
    } | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [resolvedParams, setResolvedParams] = useState<any>(null);
    const [showModal, setShowModal] = useState<boolean>(false); // Nouvel état pour la modale
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const router = useRouter();

    // Charger la préférence utilisateur au montage
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
    }, []);

    // Appliquer le mode sombre quand il change
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };


    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const resolved = await params;
                setResolvedParams(resolved);
                
                const roomId = resolved?.id;
                if (!roomId) {
                    console.error("Room ID is missing");
                    return;
                }

                const roomRef = doc(db, "rooms", roomId);
                const roomSnapshot = await getDoc(roomRef);

                if (roomSnapshot.exists()) {
                    const data = roomSnapshot.data();
                    setRoomData({
                        name: data?.name || "No name available",
                        community: data?.community || "No community ID",
                        admin: data?.admin || "No admin ID"
                    });
                } else {
                    console.error("Room not found");
                }
            } catch (error) {
                console.error("Error fetching room:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoomData();
    }, [params]);

    const handleCopyLink = () => {
        if (resolvedParams?.id) {
            const roomLink = `${window.location.origin}/rooms/new/${resolvedParams.id}`;
            navigator.clipboard.writeText(roomLink)
                .catch((error) => console.error("Copy failed:", error));
        }
    };

    const handleDeleteRoom = async () => {
        if (!resolvedParams?.id || !window.confirm("Êtes-vous sûr de vouloir supprimer cette room ?")) {
            return;
        }
    
        try {
            const roomRef = doc(db, "rooms", resolvedParams.id);
            await deleteDoc(roomRef);
            alert("Room supprimée avec succès");
            router.push("/"); // Redirige vers la page d'accueil après suppression
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            alert("Une erreur est survenue lors de la suppression");
        }
    };
    

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Vérifie si l'utilisateur courant est l'admin
    const isAdmin = roomData?.admin === CURRENT_USER_ID;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 space-y-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {roomData?.name || "Unknown Room"}
                </h1>

                {/* Bouton pour afficher les paramètres */}
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-md transition"
                >
                    Afficher les paramètres
                </button>

                
                
            </div>

            {/* Modale des paramètres */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Paramètres de la Room
                            </h2>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Affichage des informations */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Informations de la Room</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Nom:</span> {roomData?.name}
                                </p>
                                <p className="text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Community ID:</span> {roomData?.community}
                                </p>
                                <p className="text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Admin ID:</span> {roomData?.admin}
                                </p>
                            </div>

                            {/* Paramètres d'affichage */}
                            <div className="space-y-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Préférences</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Dark Mode</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={darkMode}
                                        onChange={toggleDarkMode}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                            {/* Bouton de copie */}
                            <button
                                onClick={handleCopyLink}
                                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition"
                            >
                                Copy Room Link
                            </button>

                            {/* Fonctionnalités */}
                            {isAdmin && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Fonctionnalités Admin</h3>
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            router.push(`/rooms/edit/${resolvedParams.id}`);
                                        }}
                                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition"
                                    >
                                        Modifier la Room
                                    </button>
                                    
                                    <button 
                                        onClick={handleDeleteRoom}
                                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md transition"
                                    >
                                        Supprimer la Room
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}