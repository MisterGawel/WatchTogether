"use client";

import { useEffect, useState } from "react";
import { db } from "../../../../firebase";
import { doc, getDoc, deleteDoc, writeBatch, collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import ChatRoom from "./chat";
import ChatVideos from "./chatVideos";
import { onAuthStateChanged } from 'firebase/auth';

const CURRENT_USER_ID = "2";

export default function RoomPage({ params }: { params: Promise<any> }) {
    const [roomData, setRoomData] = useState<{
        name: string;
        community: string;
        admin: string; 
    } | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [resolvedParams, setResolvedParams] = useState<any>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [videoUrl, setVideoUrl] = useState<string>("");
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(!darkMode);

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
            router.push("/");
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            alert("Une erreur est survenue lors de la suppression");
        }
    };

    

    const handleDeleteAllMessages = async () => {
        if (!resolvedParams?.id) return;
    
        const batch = writeBatch(db);
        const messagesRef = collection(db, `chats/${resolvedParams.id}/messages`);
        const messagesSnapshot = await getDocs(messagesRef);
    
        messagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    
        await batch.commit();
        alert("Tous les messages ont été supprimés !");
    };

    const handleDeleteAllLinks = async () => {
        if (!resolvedParams?.id) return;
    
        const batch = writeBatch(db);
    
        const waitLinksRef = collection(db, `chats/${resolvedParams.id}/wait_links`);
        const histLinksRef = collection(db, `chats/${resolvedParams.id}/hist_links`);
    
        const waitLinksSnapshot = await getDocs(waitLinksRef);
        const histLinksSnapshot = await getDocs(histLinksRef);
    
        waitLinksSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    
        histLinksSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    
        await batch.commit();
        alert("Tous les liens (wait + hist) ont été supprimés !");
    };
    
    

    const message = `Rejoignez ma room ${roomData?.name} sur ${window.location.href}`;

    // Fonction pour gérer le partage sur la plateforme choisie
    const handleShare = (platform: string) => {
        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                break;
            case 'telegram':
                window.open(`https://t.me/share/url?text=${encodeURIComponent(message)}`, '_blank');
                break;
            default:
                break;
        }
        setShowMenu(false); // Ferme le menu après avoir sélectionné une option
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const isAdmin = roomData?.admin === CURRENT_USER_ID;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
            {/* Header avec barre d'URL */}
            <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {roomData?.name || "Unknown Room"}
                    </h1>
                    
                    {/* Barre d'URL pour les vidéos */}
                    <div className="w-full md:w-1/2 px-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="Entrez l'URL de la vidéo..."
                                className="w-full py-2 px-4 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                                onClick={() => console.log("URL soumise:", videoUrl)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-500 hover:bg-purple-600 text-white p-1 rounded-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md transition"
                        >
                            Paramètres
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenu principal avec disposition en 3 colonnes */}
            <main className="flex-1 container mx-auto p-1 max-w-10xl grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Colonne centrale - Espace vidéo (3/5) */}
                {/* Colonne centrale - Espace vidéo (3/5) */}
            <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {videoUrl ? (
                        <div className="p-4 text-center">
                            <p className="text-lg font-medium text-gray-900 dark:text-white">Lecteur vidéo intégré ici</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{videoUrl}</p>
                        </div>
                    ) : (
                        <div className="text-center p-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Aucune vidéo sélectionnée</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Entrez une URL ci-dessus pour charger une vidéo</p>
                        </div>
                    )}
                </div>
                {/* Espace de chat vidéo sous la vidéo */}
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg mt-4 shadow-lg">
                <ChatVideos 
                    roomId={resolvedParams?.id} // Utilisez la variable roomId plutôt qu'une string fixe
                    currentUser={"2"} // Passez le nom d'utilisateur actuel
                    initialMessages={[]}
                    Role={isAdmin ? "admin" : "user"}
                    />
                </div>

            </div>


                {/* Colonne de droite - Chat (1/5) */}
            {/* Colonne de droite - Chat (1/5) */}
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full">
                    <ChatRoom 
                    roomId={resolvedParams?.id} // Utilisez la variable roomId plutôt qu'une string fixe
                    currentUser={"2"} // Passez le nom d'utilisateur actuel
                    initialMessages={[]}
                    Role={isAdmin ? "admin" : "user"}
                    />
                </div>
                </div>


            </main>
            

            {/* Settings Modal */}
            {showModal && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            Paramètres de la Room
                                        </h2>
                                        <button 
                                            onClick={() => setShowModal(false)}
                                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                                        >
                                            &times;
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Informations</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nom:</p>
                                                    <p className="text-gray-900 dark:text-white">{roomData?.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Community:</p>
                                                    <p className="text-gray-900 dark:text-white">{roomData?.community}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Admin:</p>
                                                    <p className="text-gray-900 dark:text-white">{roomData?.admin}</p>
                                                </div>
                                            </div>
                                        </div>

                                        

                                        <button
                                            onClick={handleCopyLink}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                            </svg>
                                            Copier le lien
                                        </button>

                                        {/* Bouton pour afficher le menu de partage */}
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition flex items-center justify-center gap-2"
                        >
                            Partager
                        </button>

                        {/* Menu de partage */}
                        {showMenu && (
                            <div className="absolute bg-white shadow-md rounded-lg mt-2 p-4 w-auto flex gap-2">
                                <button
                                    onClick={() => handleShare('whatsapp')}
                                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex-1"
                                >
                                    WhatsApp
                                </button>

                                <button
                                    onClick={() => handleShare('telegram')}
                                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex-1"
                                >
                                    Telegram
                                </button>
                            </div>
                        )}




                            {isAdmin && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Actions Admin</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => {
                                                setShowModal(false);
                                                router.push(`/rooms/edit/${resolvedParams.id}`);
                                            }}
                                            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                            Modifier
                                        </button>
                                        <button 
                                            onClick={handleDeleteRoom}
                                            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Supprimer
                                        </button>

                                        <button
                                            onClick={handleDeleteAllMessages}
                                            className="w-full py-2 px-4 bg-red-400 hover:bg-red-500 text-white rounded-md mt-4"
                                        >
                                            Supprimer tous les messages
                                        </button>


                                        <button
                                            onClick={handleDeleteAllLinks}
                                            className="w-full py-2 px-4 bg-red-400 hover:bg-red-500 text-white rounded-md mt-4"
                                        >
                                            Supprimer tous liens
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}