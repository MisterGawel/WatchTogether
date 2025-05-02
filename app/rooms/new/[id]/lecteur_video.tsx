'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/app/firebase';
import {
    doc,
    addDoc,
    deleteDoc,
    collection,
    onSnapshot,
    serverTimestamp,
} from 'firebase/firestore';
import WrapperPlayer from '../../../players/wrapper-player';
import { getAuth } from 'firebase/auth';

export type CurrentVideo = {
    id: string;
    url: string;
    userID: string;  // ID de l'utilisateur
    userName: string; // Nom d'affichage
    timestamp: Date;
    isAdminVideo?: boolean;
};

export function useVideoPlayer(roomId: string | undefined) {
    const [lastVideoLink, setLastVideoLink] = useState<string | null>(null);
    const [currentVideo, setCurrentVideo] = useState<CurrentVideo | null>(null);
    const [pausedVideo, setPausedVideo] = useState<CurrentVideo | null>(null);

    useEffect(() => {
        if (!roomId) return;

        const waitLinksRef = collection(db, `chats/${roomId}/wait_links`);
        const unsubscribe = onSnapshot(waitLinksRef, (querySnapshot) => {
            if (!querySnapshot.empty) {
                const sortedDocs = [...querySnapshot.docs].sort(
                    (a, b) =>
                        (b.data().timestamp?.toMillis() || 0) -
                        (a.data().timestamp?.toMillis() || 0)
                );
                setLastVideoLink(sortedDocs[0]?.data()?.text || null);
            } else {
                setLastVideoLink(null);
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return;

        const lectureRef = collection(db, `chats/${roomId}/lecture`);
        const unsubscribe = onSnapshot(lectureRef, async (snapshot) => {
            if (!snapshot.empty) {
                const videoDoc = snapshot.docs[0];
                const videoData = videoDoc.data();
                
                // Récupération des valeurs depuis videoData
                const userName = videoData.user || 'Utilisateur inconnu';
                const userID = videoData.userID || videoData.user || 'ID-inconnu';

                setCurrentVideo({
                    id: videoDoc.id,
                    url: videoData.text,
                    userID: userID,      // Utilise userID si disponible, sinon user comme fallback
                    userName: userName,  // Nom d'utilisateur
                    timestamp: videoData.timestamp?.toDate() || new Date(),
                    isAdminVideo: videoData.isAdminVideo || false,
                });
            } else {
                setCurrentVideo(null);
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    const handleStopVideo = async (video: CurrentVideo) => {
        if (!roomId) return;

        try {
            await addDoc(collection(db, `chats/${roomId}/hist_links`), {
                text: video.url,
                userID: video.userID,    // ID utilisateur
                user: video.userName,     // Nom d'utilisateur
                timestamp: serverTimestamp(),
            });

            const lectureRef = doc(db, `chats/${roomId}/lecture`, video.id);
            await deleteDoc(lectureRef);

            setCurrentVideo(null);

            if (video.isAdminVideo && pausedVideo) {
                await addDoc(collection(db, `chats/${roomId}/lecture`), {
                    text: pausedVideo.url,
                    userID: pausedVideo.userID,
                    user: pausedVideo.userName,
                    timestamp: serverTimestamp(),
                });
                setPausedVideo(null);
            }
        } catch (error) {
            console.error("Erreur lors de l'arrêt de la vidéo:", error);
        }
    };

    const handleAdminVideoEnd = async () => {
        if (!roomId || !currentVideo?.isAdminVideo) return;

        try {
            await addDoc(collection(db, `chats/${roomId}/hist_links`), {
                text: currentVideo.url,
                userID: currentVideo.userID,
                user: currentVideo.userName,
                timestamp: serverTimestamp(),
            });

            const lectureRef = doc(db, `chats/${roomId}/lecture`, currentVideo.id);
            await deleteDoc(lectureRef);

            if (pausedVideo) {
                await addDoc(collection(db, `chats/${roomId}/lecture`), {
                    text: pausedVideo.url,
                    userID: pausedVideo.userID,
                    user: pausedVideo.userName,
                    timestamp: serverTimestamp(),
                });
                setPausedVideo(null);
            }
        } catch (error) {
            console.error('Erreur lors de la gestion de fin de vidéo admin:', error);
        }
    };

    return {
        lastVideoLink,
        currentVideo,
        pausedVideo,
        setPausedVideo,
        handleStopVideo,
        handleAdminVideoEnd,
    };
}


export function WrapperPlayerWithEnd({
    link,
    onEnd,
    darkMode = false,
}: {
    link: string;
    onEnd?: () => void;
    darkMode?: boolean;
}) {
    const playerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEnd = () => {
            onEnd?.();
        };

        return () => {
            //
        };
    }, [onEnd]);

    return <WrapperPlayer link={link}  />;
}

interface VideoPlayerProps {
    roomId: string | undefined;
    isAdmin: boolean;
    currentUserId: string | null;
    currentUserName: string;
    videoUrl: string;
    onAdminVideoSubmit: () => void;
    setVideoUrl: (url: string) => void;
    setPausedVideo: (video: CurrentVideo | null) => void;
    darkMode?: boolean;
}


export function VideoPlayer({
    roomId,
    isAdmin,
    currentUserId,
    currentUserName,
    videoUrl,
    onAdminVideoSubmit,
    setVideoUrl,
    setPausedVideo,
    darkMode = false,
}: VideoPlayerProps) {
    const {
        lastVideoLink,
        currentVideo,
        pausedVideo,
        handleStopVideo,
        handleAdminVideoEnd,
    } = useVideoPlayer(roomId);

    const urlToUse = lastVideoLink || videoUrl;

    return (
        <div className={`overflow-hidden rounded-lg shadow-lg lg:col-span-3 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`relative flex items-center justify-center w-full aspect-video ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {currentVideo ? (
                    currentVideo.url ? (
                        <>

                            <div className="w-full h-full">
                                <WrapperPlayerWithEnd
                                    link={currentVideo.url}
                                    onEnd={() => {
                                        if (currentVideo.isAdminVideo) {
                                            handleAdminVideoEnd();
                                        }
                                    }}
                                    darkMode={darkMode}
                                />
                            </div>
                            {(currentVideo.userID === currentUserId ||
                                isAdmin) && (
                                <button
                                    onClick={() =>
                                        handleStopVideo(currentVideo)
                                    }
                                    className="absolute z-10 p-2 text-white bg-red-500 rounded-md top-2 right-2 hover:bg-red-600"
                                    title="Arrêter la vidéo"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="p-4 text-center">
                            <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                URL vidéo non reconnue
                            </p>
                            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                La vidéo en cours de lecture n'est pas une URL
                                valide
                            </p>
                        </div>
                    )
                ) : !urlToUse ? (
                    <div className="p-8 text-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-16 h-16 mx-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Aucune vidéo en cours de lecture
                        </p>
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <WrapperPlayer link={urlToUse} />
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className="w-full px-4 py-2">
                    <div className="relative">
                        <input
                            type="text"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="Entrez l'URL de la vidéo admin..."
                            className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                darkMode 
                                    ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' 
                                    : 'bg-white text-gray-900 border-gray-300'
                            }`}
                        />
                        <button
                            onClick={onAdminVideoSubmit}
                            className={`absolute p-1 transform -translate-y-1/2 rounded-md right-2 top-1/2 ${
                                darkMode 
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                            }`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            

        </div>
    );
}