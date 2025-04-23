"use client";
import { tr } from "framer-motion/client";
import React, { useState } from "react";

const youtubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const twitchClientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
const twitchClientSecret = process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET;

export default function SearchBar({ onSelect }) {
    const [inputValue, setInputValue] = useState("");
    const [platform, setPlatform] = useState("youtube");
    const [results, setResults] = useState([]);

    const fetchYoutubeVideos = async (query) => {

        //Requete to YouTube API
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${youtubeApiKey}&type=video`,
        );

        //Attendre la réponse
        const data = await response.json();

        //On renvoie les résultats
        //https://developers.google.com/youtube/v3/docs/videos?hl=fr
        return data.items.map((item) => ({
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url,
            description: item.snippet.description,
            channel: item.snippet.channelTitle,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));
    };

    const getTwitchOauthToken = async () => {

        //Requete to Twitch API
        const response = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: twitchClientId,
                client_secret: twitchClientSecret,
                grant_type: "client_credentials",
            }),
        });

        //Attendre la réponse
        const data = await response.json();
        return data;
    }

    const fetchTwitchVideos = async (query) => {
        const tokendata = await getTwitchOauthToken();
        
        const response = await fetch(
            `https://api.twitch.tv/helix/search/channels?query=${query}`,
            {
                method: "GET",
                headers: {
                    "Client-ID": twitchClientId,
                    "Authorization": `Bearer ${tokendata.access_token}`,
                },
            }
        );

        const data = await response.json();
        console.log(data);

        return data.data
            .filter((item) => item.is_live === true) // Filtrer les résultats pour ne garder que les chaînes en direct
            .map((item) => ({
            title: item.display_name,
            broadcaster_language: item.broadcaster_language,
            url: `https://www.twitch.tv/${item.broadcaster_login}`,
            }));

    };

    const searchVideos = async (query, platform) => {
        let fetchedVideos = [];

        switch (platform) {
            case "youtube":
                fetchedVideos = await fetchYoutubeVideos(query);
                break;
            
            case "twitch":
                fetchedVideos = await fetchTwitchVideos(query);
                break;

            default:
                break;
        }
        console.log(fetchedVideos);
        setResults(fetchedVideos);
    };

    const handleSearch = async () => {
        if (inputValue.trim() !== "") {
            await searchVideos(inputValue, platform);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Rechercher une vidéo..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="border p-2 w-full"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Rechercher
                    </button>
                </div>
                <div className="flex space-x-4">
                    <label>
                        <input
                            type="radio"
                            name="platform"
                            value="youtube"
                            checked={platform === "youtube"}
                            onChange={() => setPlatform("youtube")}
                        />
                        YouTube
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="platform"
                            value="twitch"
                            checked={platform === "twitch"}
                            onChange={() => setPlatform("twitch")}
                        />
                        Twitch
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="platform"
                            value="dailymotion"
                            checked={platform === "dailymotion"}
                            onChange={() => setPlatform("dailymotion")}
                        />
                        Dailymotion
                    </label>
                </div>
            </div>
            <ul className="space-y-2">
                {results.map((result, index) => (
                    <li
                        key={index}
                        className="border p-2 cursor-pointer"
                        onClick={() => onSelect(result)}
                    >
                        {result.title}
                    </li>
                ))}
            </ul>
        </div>
    );
}