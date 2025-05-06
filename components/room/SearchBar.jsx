'use client';
import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // pas solid = pas de fond
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	ModalFooter,
} from '@heroui/modal';
import { Button } from '@heroui/button';

const config = {
	youtubeApiKey: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
	twitchClientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID,
	twitchClientSecret: process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET,
};

function PlatformIcon({ platform }) {
	switch (platform) {
		case 'youtube':
			return <img src="/youtube.svg" alt="YouTube" className="w-5 h-5" />;
		case 'twitch':
			return <img src="/twitch.svg" alt="Twitch" className="w-5 h-5" />;
		case 'dailymotion':
			return (
				<img
					src="/dailymotion.svg"
					alt="Dailymotion"
					className="w-5 h-5"
				/>
			);
		default:
			return null;
	}
}

function VideoItem({ result, platform, onSelect }) {
	return (
		<li
			className="flex flex-row p-3 space-x-4 transition-colors rounded-lg cursor-pointer hover:bg-gray-100"
			onClick={() => onSelect(result)}
		>
			{/* Thumbnail */}
			{result.thumbnail && (
				<div className="flex-shrink-0 w-40">
					<img
						src={result.thumbnail}
						alt={result.title}
						className="object-cover w-full h-24 rounded-lg"
					/>
				</div>
			)}

			{/* Video info */}
			<div className="flex flex-col flex-1 overflow-hidden">
				{/* Title */}
				<p className="flex items-center gap-1 text-sm font-semibold sm:text-base line-clamp-2">
					{platform === 'twitch' && result.isLive && (
						<span className="text-xs text-red-500">🔴 Live</span>
					)}
					{result.title}
				</p>

				{/* Channel */}
				{result.channel && (
					<p className="mt-1 text-xs text-gray-500 sm:text-sm">
						{result.channel}
					</p>
				)}

				{/* Description */}
				{result.description && (
					<p className="hidden mt-2 text-xs text-gray-400 sm:block line-clamp-2">
						{result.description}
					</p>
				)}
			</div>
		</li>
	);
}

export default function SearchBar({ onSelect }) {
	const [inputValue, setInputValue] = useState('');
	const [platform, setPlatform] = useState('youtube');
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
		return (
			data.items?.map((item) => ({
				title: item.snippet.title,
				thumbnail: item.snippet.thumbnails.default.url,
				description: item.snippet.description,
				channel: item.snippet.channelTitle,
				url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
			})) || []
		);
	}

	async function getTwitchOauthToken() {
		const response = await fetch('https://id.twitch.tv/oauth2/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: config.twitchClientId,
				client_secret: config.twitchClientSecret,
				grant_type: 'client_credentials',
			}),
		});
		return await response.json();
	}

	async function fetchTwitchVideos(query) {
		const tokenData = await getTwitchOauthToken();
		const response = await fetch(
			`https://api.twitch.tv/helix/search/channels?query=${query}`,
			{
				method: 'GET',
				headers: {
					'Client-ID': config.twitchClientId,
					Authorization: `Bearer ${tokenData.access_token}`,
				},
			}
		);
		const data = await response.json();
		return (
			data.data?.map((item) => ({
				title: item.display_name,
				thumbnail: item.thumbnail_url || '',
				broadcaster_language: item.broadcaster_language,
				url: `https://www.twitch.tv/${item.broadcaster_login}`,
				isLive: item.is_live,
			})) || []
		);
	}

	async function fetchDailymotionVideos(query) {
		const response = await fetch(
			`https://api.dailymotion.com/videos?search=${query}&fields=id,title,thumbnail_120_url,description,channel&limit=10`
		);
		const data = await response.json();
		return (
			data.list?.map((item) => ({
				title: item.title,
				thumbnail: item.thumbnail_120_url,
				description: item.description,
				channel: item.channel,
				url: `https://www.dailymotion.com/video/${item.id}`,
			})) || []
		);
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
			console.error('Erreur:', error);
		}
		setIsLoading(false);
	};

	const handleSearch = async () => {
		if (inputValue.trim() !== '') {
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
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSearch();
		}
	};

	console.log(platform);

	return (
		<div className="space-y-4 h-[40px]">
			{/* Search input + Select */}
			<div className="flex items-center space-x-2">
				<div className="relative flex-grow">
					<Input
						type="text"
						placeholder="Rechercher une vidéo..."
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
					<button
						onClick={handleSearch}
						disabled={isLoading}
						className="absolute text-gray-700 transform -translate-y-1/2 top-1/2 right-2 hover:text-gray-900 disabled:text-gray-400"
					>
						{isLoading ? (
							<span className="text-sm">...</span>
						) : (
							<MagnifyingGlassIcon className="w-5 h-5" />
						)}
					</button>
				</div>

				<div className="flex items-center space-x-2">
					<Select
						selectedKeys={new Set([platform])}
						defaultSelectedKeys={['youtube']}
						aria-label="Select a platform"
						onSelectionChange={(keys) => {
							const selected = Array.from(keys)[0];
							setPlatform(selected);
						}}
						color="default"
						startContent={<PlatformIcon platform={platform} />}
						size="md"
						className="outline-none min-w-48"
					>
						<SelectItem
							key="youtube"
							startContent={
								<img
									src="/youtube.svg"
									alt="YouTube"
									className="w-5 h-5 mr-2"
								/>
							}
						>
							YouTube
						</SelectItem>
						<SelectItem
							key="twitch"
							startContent={
								<img
									src="/twitch.svg"
									alt="Twitch"
									className="w-5 h-5 mr-2"
								/>
							}
						>
							Twitch
						</SelectItem>
					</Select>
				</div>
			</div>

			<Modal isOpen={isModalOpen} onClose={closeModal} size="3xl">
				<ModalContent>
					<ModalHeader>Résultats de recherche</ModalHeader>
					<ModalBody className="max-h-[60vh] overflow-y-auto">
						{results.length === 0 ? (
							<p className="text-center text-gray-500">
								Aucun résultat trouvé.
							</p>
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
					</ModalBody>
					<ModalFooter>
						<Button onPress={closeModal}>Fermer</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	);
}
