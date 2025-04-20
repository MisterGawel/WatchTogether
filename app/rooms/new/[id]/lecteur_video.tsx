"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "../../../../firebase";
import { doc, addDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import YoutubePlayer from '../../../players/youtube-player';

export type CurrentVideo = {
  id: string;
  url: string;
  user: string;
  timestamp: Date;
  isAdminVideo?: boolean;
};

export function useVideoPlayer(roomId: string | undefined) {
  const [lastVideoLink, setLastVideoLink] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<CurrentVideo | null>(null);
  const [pausedVideo, setPausedVideo] = useState<CurrentVideo | null>(null);

  // Récupération du dernier lien vidéo en temps réel
  useEffect(() => {
    if (!roomId) return;

    const waitLinksRef = collection(db, `chats/${roomId}/wait_links`);
    const unsubscribe = onSnapshot(waitLinksRef, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const sortedDocs = [...querySnapshot.docs].sort((a, b) => 
          (b.data().timestamp?.toMillis() || 0) - (a.data().timestamp?.toMillis() || 0)
        );
        setLastVideoLink(sortedDocs[0]?.data()?.text || null);
      } else {
        setLastVideoLink(null);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Récupération de la vidéo en cours de lecture
  useEffect(() => {
    if (!roomId) return;

    const lectureRef = collection(db, `chats/${roomId}/lecture`);
    const unsubscribe = onSnapshot(lectureRef, async (snapshot) => {
      if (!snapshot.empty) {
        const videoDoc = snapshot.docs[0];
        const videoData = videoDoc.data();
        setCurrentVideo({
          id: videoDoc.id,
          url: videoData.text,
          user: videoData.user,
          timestamp: videoData.timestamp?.toDate() || new Date(),
          isAdminVideo: videoData.isAdminVideo || false
        });
      } else {
        setCurrentVideo(null);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleStopVideo = async (video: CurrentVideo) => {
    if (!roomId) return;
  
    try {
      await addDoc(collection(db, `chats/${roomId}/hist_links`), {
        text: video.url,
        user: video.user,
        timestamp: serverTimestamp()
      });
  
      const lectureRef = doc(db, `chats/${roomId}/lecture`, video.id);
      await deleteDoc(lectureRef);
  
      setCurrentVideo(null);
      
      if (video.isAdminVideo && pausedVideo) {
        await addDoc(collection(db, `chats/${roomId}/lecture`), {
          text: pausedVideo.url,
          user: pausedVideo.user,
          timestamp: serverTimestamp()
        });
        setPausedVideo(null);
      }
    } catch (error) {
      console.error("Erreur lors de l'arrêt de la vidéo:", error);
      alert("Une erreur est survenue lors de l'arrêt de la vidéo");
    }
  };

  const handleAdminVideoEnd = async () => {
    if (!roomId || !currentVideo?.isAdminVideo) return;

    try {
      await addDoc(collection(db, `chats/${roomId}/hist_links`), {
        text: currentVideo.url,
        user: currentVideo.user,
        timestamp: serverTimestamp()
      });

      const lectureRef = doc(db, `chats/${roomId}/lecture`, currentVideo.id);
      await deleteDoc(lectureRef);

      if (pausedVideo) {
        await addDoc(collection(db, `chats/${roomId}/lecture`), {
          text: pausedVideo.url,
          user: pausedVideo.user,
          timestamp: serverTimestamp()
        });
        setPausedVideo(null);
      }
    } catch (error) {
      console.error("Erreur lors de la gestion de fin de vidéo admin:", error);
    }
  };

  return {
    lastVideoLink,
    currentVideo,
    pausedVideo,
    setPausedVideo,
    extractYouTubeId,
    handleStopVideo,
    handleAdminVideoEnd
  };
}

export function YoutubePlayerWithEnd({ videoId, onEnd }: { videoId: string; onEnd?: () => void }) {
  const playerRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.event === "onStateChange" && data.info === 0) {
          onEnd?.();
        }
      } catch (e) {
        console.error("Error parsing YouTube message:", e);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onEnd]);

  return <YoutubePlayer videoId={videoId} />;
}

interface VideoPlayerProps {
  roomId: string | undefined;
  isAdmin: boolean;
  currentUserId: string | null;
  videoUrl: string;
  onAdminVideoSubmit: () => void;
  setVideoUrl: (url: string) => void;
  setPausedVideo: (video: CurrentVideo | null) => void;
}

export function VideoPlayer({
  roomId,
  isAdmin,
  currentUserId,
  videoUrl,
  onAdminVideoSubmit,
  setVideoUrl,
  setPausedVideo
}: VideoPlayerProps) {
  const {
    lastVideoLink,
    currentVideo,
    pausedVideo,
    extractYouTubeId,
    handleStopVideo,
    handleAdminVideoEnd
  } = useVideoPlayer(roomId);

  const urlToUse = lastVideoLink || videoUrl;
  const youtubeIdFromCurrent = currentVideo ? extractYouTubeId(currentVideo.url) : null;
  const youtubeIdFromUrl = urlToUse ? extractYouTubeId(urlToUse) : null;

  return (
    <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
        {currentVideo ? (
          youtubeIdFromCurrent ? (
            <>
              <div className="w-full h-full">
                <YoutubePlayerWithEnd 
                  videoId={youtubeIdFromCurrent}
                  onEnd={() => {
                    if (currentVideo.isAdminVideo) {
                      handleAdminVideoEnd();
                    }
                  }}
                />
              </div>
              {(currentVideo.user === currentUserId || isAdmin) && (
                <button
                  onClick={() => handleStopVideo(currentVideo)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-md z-10"
                  title="Arrêter la vidéo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <div className="p-4 text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-white">URL vidéo non reconnue</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                La vidéo en cours de lecture n'est pas une URL YouTube valide
              </p>
            </div>
          )
        ) : !urlToUse ? (
          <div className="text-center p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Aucune vidéo en cours de lecture</p>
          </div>
        ) : !youtubeIdFromUrl ? (
          <div className="p-4 text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-white">URL vidéo non reconnue</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {lastVideoLink 
                ? "Le dernier lien dans wait_links n'est pas une URL YouTube valide"
                : "Seules les URLs YouTube sont supportées"}
            </p>
          </div>
        ) : (
          <div className="w-full h-full">
            <YoutubePlayer videoId={youtubeIdFromUrl} />
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
              className="w-full py-2 px-4 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={onAdminVideoSubmit}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-500 hover:bg-purple-600 text-white p-1 rounded-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}