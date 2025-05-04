"use client";
import React, { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"; // pas solid = pas de fond

const config = {
  youtubeApiKey: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
  twitchClientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID,
  twitchClientSecret: process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET,
};

function PlatformIcon({ platform }) {
  switch (platform) {
    case "youtube":
      return <img src="/youtube.svg" alt="YouTube" className="h-5 w-5" />;
    case "twitch":
      return <img src="/twitch.svg" alt="Twitch" className="h-5 w-5" />;
    case "dailymotion":
      return <img src="/dailymotion.svg" alt="Dailymotion" className="h-5 w-5" />;
    default:
      return null;
  }
}

function VideoItem({ result, platform, onSelect }) {
  return (
    <li
      className="flex items-center space-x-4 p-2 border rounded hover:bg-gray-100 cursor-pointer"
      onClick={() => onSelect(result)}
    >
      {result.thumbnail && (
        <img
          src={result.thumbnail}
          alt={result.title}
          className="w-16 h-16 object-cover rounded"
        />
      )}
      <div>
        <p className="font-semibold flex items-center space-x-1">
          {platform === "twitch" && result.isLive && (
            <span className="text-red-500">🔴</span>
          )}
          <span>{result.title}</span>
        </p>
        {result.channel && (
          <p className="text-sm text-gray-500">{result.channel}</p>
        )}
      </div>
    </li>
  );
}

export default function SearchBar({ onSelect }) {
  const [inputValue, setInputValue] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [results, setResults] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchers = {
    youtube: fetchYoutubeVideos,
    twitch: fetchTwitchVideos,
    dailymotion: fetchDailymotionVideos,
  };

  async function fetchYoutubeVideos(query) {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${config.youtubeApiKey}&type=video&maxResults=10`
    );
    const data = await response.json();
    return data.items?.map((item) => ({
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.default.url,
      description: item.snippet.description,
      channel: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    })) || [];
  }

  async function getTwitchOauthToken() {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.twitchClientId,
        client_secret: config.twitchClientSecret,
        grant_type: "client_credentials",
      }),
    });
    return await response.json();
  }

  async function fetchTwitchVideos(query) {
    const tokenData = await getTwitchOauthToken();
    const response = await fetch(
      `https://api.twitch.tv/helix/search/channels?query=${query}`,
      {
        method: "GET",
        headers: {
          "Client-ID": config.twitchClientId,
          "Authorization": `Bearer ${tokenData.access_token}`,
        },
      }
    );
    const data = await response.json();
    return data.data?.map((item) => ({
      title: item.display_name,
      thumbnail: item.thumbnail_url || "",
      broadcaster_language: item.broadcaster_language,
      url: `https://www.twitch.tv/${item.broadcaster_login}`,
      isLive: item.is_live,
    })) || [];
  }

  async function fetchDailymotionVideos(query) {
    const response = await fetch(
      `https://api.dailymotion.com/videos?search=${query}&fields=id,title,thumbnail_120_url,description,channel&limit=10`
    );
    const data = await response.json();
    return data.list?.map((item) => ({
      title: item.title,
      thumbnail: item.thumbnail_120_url,
      description: item.description,
      channel: item.channel,
      url: `https://www.dailymotion.com/video/${item.id}`,
    })) || [];
  }

  const searchVideos = async (query, platform) => {
    const fetcher = fetchers[platform];
    if (!fetcher) return;
    setIsLoading(true);
    try {
      const fetchedVideos = await fetcher(query);
      setResults(fetchedVideos);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erreur:", error);
    }
    setIsLoading(false);
  };

  const handleSearch = async () => {
    if (inputValue.trim() !== "") {
      await searchVideos(inputValue, platform);
    }
  };

  const handleSelect = (video) => {
    onSelect(video);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search input + Select */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Rechercher une vidéo..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border p-2 pl-4 pr-12 rounded w-full"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-700 hover:text-gray-900 disabled:text-gray-400"
          >
            {isLoading ? (
              <span className="text-sm">...</span>
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2 border p-2 rounded">
          <PlatformIcon platform={platform} />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-white outline-none"
          >
            <option value="youtube">YouTube</option>
            <option value="twitch">Twitch</option>
            {/*<option value="dailymotion">Dailymotion</option>*/}
          </select>
        </div>
      </div>

      {/* Modal results */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="relative bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 lg:w-1/2 max-h-[80vh] overflow-y-auto p-6 space-y-4">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
            >
              &times;
            </button>

            <h2 className="text-xl font-semibold mb-4">Résultats de recherche</h2>

            {results.length === 0 ? (
              <p className="text-center text-gray-500">Aucun résultat trouvé.</p>
            ) : (
              <ul className="space-y-2">
                {results.map((result, index) => (
                  <VideoItem
                    key={index}
                    result={result}
                    platform={platform}
                    onSelect={handleSelect}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
