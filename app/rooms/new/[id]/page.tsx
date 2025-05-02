'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/app/firebase';
import { doc, getDoc, addDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRoomParams, useRoomActions } from './params';
import { VideoPlayer, CurrentVideo } from './lecteur_video';
import ChatRoom from './chat';
import ChatVideos from './chatVideos';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';

export default function RoomPage({ params }: { params: Promise<any> }) {
    const { roomData, loading, resolvedParams } = useRoomParams(params);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [pausedVideo, setPausedVideo] = useState<CurrentVideo | null>(null);
    const [message, setMessage] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [forceUpdate, setForceUpdate] = useState(0);
    const [darkMode, setDarkMode] = useState(false);
    const [communityName, setCommunityName] = useState<string>('');
    const [adminName, setAdminName] = useState<string>('');
    const [loadingNames, setLoadingNames] = useState(false);

    const {
        isAdmin,
        handleCopyLink,
        handleDeleteRoom,
        handleDeleteAllMessages,
        handleDeleteAllLinks,
        handleRenameUser
    } = useRoomActions(resolvedParams, roomData, currentUser);

    // Vérifier le préférence de l'utilisateur au chargement
    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode) {
            setDarkMode(savedMode === 'true');
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
        }
    }, []);

    // Appliquer le mode sombre/clair au document
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

    const fetchNames = async () => {
        if (!roomData) return;
        setLoadingNames(true);

        try {
            // Récupérer le nom de la communauté
            if (roomData.community) {
                const communityDoc = await getDoc(doc(db, 'communities', roomData.community));
                if (communityDoc.exists()) {
                    setCommunityName(communityDoc.data().name || '');
                }
            }

            // Récupérer le nom de l'admin
            if (roomData.admin) {
                const adminDoc = await getDoc(doc(db, 'users', roomData.admin));
                if (adminDoc.exists()) {
                    setAdminName(adminDoc.data().name || adminDoc.data().email || '');
                }
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des noms:", error);
        } finally {
            setLoadingNames(false);
        }
    };

    useEffect(() => {
        if (roomData) {
            fetchNames();
        }
    }, [roomData]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Vérifier si l'utilisateur est banni de cette room
                if (resolvedParams?.id) {
                    const banRef = doc(db, 'rooms', resolvedParams.id, 'excluded', user.uid);
                    const banSnap = await getDoc(banRef);
                    
                    if (banSnap.exists()) {
                        // L'utilisateur est banni, on le redirige
                        alert("Vous avez été banni de cette room");
                        router.push('/');
                        return;
                    }
                }
    
                setCurrentUser(user);
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
    
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setUserName(data.name || user.email);
                } 
            } else {
                setCurrentUser(null);
                
                if (roomData?.community === "" || roomData?.community === null) {
                    router.push('/');
                    return;
                }
    
                let guestName = localStorage.getItem('guestName');
    
                if (!guestName) {
                    const counter = parseInt(localStorage.getItem('anonCounter') || '1', 10);
                    guestName = `anonymous${counter}`;
                    localStorage.setItem('guestName', guestName);
                    localStorage.setItem('anonCounter', (counter + 1).toString());
                }
    
                setUserName(guestName);
            }
        });
    
        return () => unsubscribe();
    }, [router, roomData?.community, resolvedParams?.id]);

    useEffect(() => {
        if (roomData?.name) {
            setMessage(
                `Rejoignez ma room ${roomData.name} sur ${window.location.href}`
            );
        }
    }, [roomData?.name]);

    const handleShare = (platform: string) => {
        switch (platform) {
            case 'whatsapp':
                window.open(
                    `https://wa.me/?text=${encodeURIComponent(message)}`,
                    '_blank'
                );
                break;
            case 'telegram':
                window.open(
                    `https://t.me/share/url?text=${encodeURIComponent(message)}`,
                    '_blank'
                );
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
                userName: userName,
                timestamp: serverTimestamp(),
                isAdminVideo: true,
            });
            setVideoUrl('');
        } catch (error) {
            console.error("Erreur lors de l'ajout de la vidéo admin:", error);
        }
    };

    const handleUpdateGuestName = async () => {
        if (!userName.trim()) {
            alert('Le pseudo ne peut pas être vide');
            return;
        }

        const oldName = localStorage.getItem('guestName') || '';
        if (userName.trim() === oldName) {
            return;
        }

        if (!resolvedParams?.id) {
            alert('Room ID non disponible');
            return;
        }

        try {
            const success = await handleRenameUser(oldName, userName.trim());
            
            if (success) {
                localStorage.setItem('guestName', userName.trim());
                setForceUpdate(prev => prev + 1);
            } else {
                setUserName(oldName);
            }
        } catch (error) {
            console.error("Erreur lors du changement de pseudo:", error);
            alert("Une erreur est survenue lors du changement de pseudo");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col min-h-screen ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
            <header className={`px-6 py-4 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex flex-col items-center justify-between mx-auto space-y-4 max-w-7xl md:flex-row md:space-y-0">
                    <h1 className="text-2xl font-bold">
                        {roomData?.name || 'Unknown Room'}
                    </h1>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-full focus:outline-none"
                            aria-label={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
                        >
                            {darkMode ? (
                                <SunIcon className="w-6 h-6 text-yellow-300" />
                            ) : (
                                <MoonIcon className="w-6 h-6 text-gray-700" />
                            )}
                        </button>

                        {currentUser ? (
                            <div className="flex items-center">
                                <span className={`mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {userName}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                               
                            </div>
                        )}
                        <button
                            onClick={() => setShowModal(true)}
                            className={`px-4 py-2 text-white transition rounded-md ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'}`}
                        >
                            Paramètres
                        </button>
                    </div>
                </div>
            </header>

            <main className="container grid flex-1 grid-cols-1 gap-6 p-1 mx-auto max-w-10xl lg:grid-cols-5">
                <VideoPlayer
                    key={`video-${forceUpdate}`}
                    roomId={resolvedParams?.id}
                    isAdmin={isAdmin}
                    currentUserId={currentUser?.uid || null}
                    currentUserName={userName}
                    videoUrl={videoUrl}
                    onAdminVideoSubmit={handleAdminVideoSubmit}
                    setVideoUrl={setVideoUrl}
                    setPausedVideo={setPausedVideo}
                    darkMode={darkMode}
                />

                {resolvedParams?.id && (
                    <>
                        <div className="lg:col-span-2">
                            <div className={`h-full rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <ChatRoom
                                    key={`chat-${forceUpdate}`}
                                    roomId={resolvedParams.id}
                                    currentUser={userName}
                                    initialMessages={[]}
                                    Role={isAdmin ? 'admin' : 'user'}
                                    darkMode={darkMode}
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                            <div className={`h-full rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <ChatVideos
                                    key={`videos-${forceUpdate}`}
                                    roomId={resolvedParams.id}
                                    currentUser={userName}
                                    initialMessages={[]}
                                    Role={isAdmin ? 'admin' : 'user'}
                                    darkMode={darkMode}
                                />
                            </div>


                            
                        </div>

                        <div className="lg:col-span-1 hidden lg:block w-64 ml-4">
                            <div className="h-full p-4 flex justify-center items-center">
                                <div className="aspect-square w-3/4 max-w-xs rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 mx-auto">
                                    <img 
                                        src="/room.jpg" 
                                        alt="Sidebar" 
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1 hidden lg:block w-64 ml-4">
                            <div className="h-full p-4 flex justify-center items-center">
                                <div className="aspect-square w-3/4 max-w-xs rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 mx-auto">
                                    <img 
                                        src="/room_2.jpg" 
                                        alt="Sidebar" 
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            </div>
                        </div>


                        
                    </>
                )}
            </main>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className={`p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">
                                Paramètres de la Room
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className={`text-2xl ${darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="font-semibold">
                                    Informations
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Nom:
                                        </p>
                                        <p>
                                            {roomData?.name || resolvedParams?.id || 'Unknown'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Community:
                                        </p>
                                        {loadingNames ? (
                                            <div className="w-4 h-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                                        ) : (
                                            <p>
                                                {communityName || roomData?.community || 'Aucune'}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Admin:
                                        </p>
                                        {loadingNames ? (
                                            <div className="w-4 h-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                                        ) : (
                                            <p>
                                                {adminName || roomData?.admin || 'Unknown'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCopyLink}
                                className="flex items-center justify-center w-full gap-2 px-4 py-2 text-white transition bg-blue-500 rounded-md hover:bg-blue-600"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                </svg>
                                Copier le lien
                            </button>

                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center justify-center w-full gap-2 px-4 py-2 text-white transition bg-gray-500 rounded-md hover:bg-gray-600"
                            >
                                Partager
                            </button>

                            {showMenu && (
                                <div className={`absolute flex w-auto gap-2 p-4 mt-2 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                    <button
                                        onClick={() => handleShare('whatsapp')}
                                        className="flex-1 px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600"
                                    >
                                        WhatsApp
                                    </button>
                                    <button
                                        onClick={() => handleShare('telegram')}
                                        className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                    >
                                        Telegram
                                    </button>
                                </div>
                            )}

                            {!currentUser && (
                                <div className={`flex flex-col p-3 space-y-2 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Pseudo :
                                </span>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        placeholder="Votre pseudo"
                                        className={`w-full ${darkMode ? 'bg-gray-600 text-white placeholder-gray-400' : 'bg-white text-gray-900'}`}
                                    />
                                    <Button 
                                        onPress={handleUpdateGuestName}
                                        size="sm"
                                        className="whitespace-nowrap"
                                    >
                                        Modifier
                                    </Button>
                                </div>
                            </div>
                            )}

                            {isAdmin && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold">
                                        Actions Admin
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => {
                                                setShowModal(false);
                                                router.push(`/rooms/edit/${resolvedParams?.id}`);
                                            }}
                                            className="flex items-center justify-center gap-2 px-4 py-2 text-white transition bg-green-500 rounded-md hover:bg-green-600"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-5 h-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                            Modifier
                                        </button>
                                        <button
                                            onClick={handleDeleteRoom}
                                            className="flex items-center justify-center gap-2 px-4 py-2 text-white transition bg-red-500 rounded-md hover:bg-red-600"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-5 h-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            Supprimer
                                        </button>

                                        <button
                                            onClick={handleDeleteAllMessages}
                                            className="w-full px-4 py-2 mt-4 text-white bg-red-400 rounded-md hover:bg-red-500"
                                        >
                                            Supprimer tous les messages
                                        </button>

                                        <button
                                            onClick={handleDeleteAllLinks}
                                            className="w-full px-4 py-2 mt-4 text-white bg-red-400 rounded-md hover:bg-red-500"
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