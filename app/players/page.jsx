'use client';
import WrapperPlayer from './wrapper-player.jsx';
import SearchBar from './SearchBar.jsx';
import { useState } from 'react';

export default function Home() {
	const [selectedVideo, setSelectedVideo] = useState(null);

	return (
		<div>
			<SearchBar onSelect={setSelectedVideo} />
			<main>
				{selectedVideo && <WrapperPlayer link={selectedVideo.url} />}
			</main>
		</div>
	);
}
