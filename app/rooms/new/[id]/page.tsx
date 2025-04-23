"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../../../firebase";
import { doc, addDoc, deleteDoc, writeBatch, collection, getDocs, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import ChatRoom from "./chat";
import ChatVideos from "./chatVideos";
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRoomParams, useRoomActions } from './params';
import { VideoPlayer, CurrentVideo } from './lecteur_video';

export default function RoomPage({ params }: { params: Promise<any> }) {
    const { roomData, loading, resolvedParams } = useRoomParams(params);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [videoUrl, setVideoUrl] = useState<string>("");
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [pausedVideo, setPausedVideo] = useState<CurrentVideo | null>(null);
    const [message, setMessage] = useState<string>("");
    
    const { isAdmin, handleCopyLink, handleDeleteRoom, handleDeleteAllMessages, handleDeleteAllLinks } = useRoomActions(resolvedParams, roomData, currentUser);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
            }
        });
        return () => unsubscribe();
    }, [router]);

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

    useEffect(() => {
        if (roomData?.name) {
            setMessage(`Rejoignez ma room ${roomData.name} sur ${window.location.href}`);
        }
    }, [roomData?.name]);

    const toggleDarkMode = () => setDarkMode(!darkMode);

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
        setShowMenu(false);
    };

    const handleAdminVideoSubmit = async () => {
        if (!videoUrl || !resolvedParams?.id || !currentUser) return;
        
        try {
            await addDoc(collection(db, `chats/${resolvedParams.id}/lecture`), {
                text: videoUrl,
                user: currentUser.uid,
                timestamp: serverTimestamp(),
                isAdminVideo: true
            });
            setVideoUrl("");
        } catch (error) {
            console.error("Erreur lors de l'ajout de la vidéo admin:", error);
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
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
            <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {roomData?.name || "Unknown Room"}
                    </h1>
                    
                    <div className="flex space-x-4">
                        {currentUser && (
                            <div className="flex items-center">
                                <span className="mr-2 text-gray-700 dark:text-gray-300">
                                    {currentUser.email || currentUser.uid}
                                </span>
                            </div>
                        )}
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

            <main className="flex-1 container mx-auto p-1 max-w-10xl grid grid-cols-1 lg:grid-cols-5 gap-6">
                <VideoPlayer
                  roomId={resolvedParams?.id}
                  isAdmin={isAdmin}
                  currentUserId={currentUser?.uid || null}
                  videoUrl={videoUrl}
                  onAdminVideoSubmit={handleAdminVideoSubmit}
                  setVideoUrl={setVideoUrl}
                  setPausedVideo={setPausedVideo}
                />

                {resolvedParams?.id && (
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full">
                            <ChatRoom 
                                roomId={resolvedParams.id}
                                currentUser={currentUser?.uid || "anonymous"}
                                initialMessages={[]}
                                Role={isAdmin ? "admin" : "user"}
                            />
                        </div>
                    </div>
                )}

                {resolvedParams?.id && (
                    <div className="lg:col-span-3">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full">
                            <ChatVideos 
                                roomId={resolvedParams.id}
                                currentUser={currentUser?.uid || "anonymous"}
                                initialMessages={[]}
                                Role={isAdmin ? "admin" : "user"}
                            />
                        </div>
                    </div>
                )}
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

                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition flex items-center justify-center gap-2"
                            >
                                Partager
                            </button>

                            {showMenu && (
                                <div className="absolute bg-white dark:bg-gray-700 shadow-md rounded-lg mt-2 p-4 w-auto flex gap-2">
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
                                                router.push(`/rooms/edit/${resolvedParams?.id}`);
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