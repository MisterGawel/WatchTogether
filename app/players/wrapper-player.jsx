"use client";

import { useState } from "react";
import YoutubePlayer from "./youtube-player";
import DailymotionPlayer from "./dailymotion-player";
import TwitchPlayer from "./twitch-player";

const WrapperPlayer = ({ link }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Récupère l'ID de la vidéo en fonction du domaine
    function getVideoId(url) {
        switch (domain) {
            case 'youtube.com':
                return url.searchParams.get('v');
            case 'dailymotion.com':
                return url.pathname.split('/')[2];
            case 'twitch.tv':
                return url.pathname.split('/')[1];
            default:
                return null;
        }
    }

    // Récupère la miniature en fonction du domaine
    function getThumbnail(domain, videoId) {
        switch (domain) {
            case 'youtube.com':
                return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            case 'dailymotion.com':
                return `https://www.dailymotion.com/thumbnail/video/${videoId}`;
            case 'twitch.tv':
                return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${videoId}-640x360.jpg`;
            default:
                return '';
        }
    }

    // Récupère le domaine
    const url = new URL(link);
    const domain = url.hostname.includes('youtube.com') ? 'youtube.com' :
                   url.hostname.includes('dailymotion.com') ? 'dailymotion.com' :
                   url.hostname.includes('twitch.tv') ? 'twitch.tv' : '';

    const videoId = getVideoId(url);
    if (!videoId) {
        return <div>Impossible d'extraire l'ID de la vidéo</div>;
    }

    const thumbnailUrl = getThumbnail(domain, videoId);

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            style={{
                position: "relative",
                width: "640px", // Taille fixe
                height: "360px", // Taille fixe 
                overflow: "hidden",
                borderRadius: "8px", // Coins arrondis pour un rendu sympa
            }}
        >
            {!isHovered ? (
                <img
                    src={thumbnailUrl}
                    alt="Video thumbnail"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        cursor: "pointer",
                    }}
                />
            ) : (
                <div style={{ width: "100%", height: "100%" }}>
                    {domain === 'youtube.com' && <YoutubePlayer videoId={videoId} />}
                    {domain === 'dailymotion.com' && <DailymotionPlayer videoId={videoId} />}
                    {domain === 'twitch.tv' && <TwitchPlayer channel={videoId} />}
                </div>
            )}
        </div>
    );
};

export default WrapperPlayer;
