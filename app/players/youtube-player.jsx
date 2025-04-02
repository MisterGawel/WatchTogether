const YoutubePlayer = ({ videoId }, ref) => {
	return (
		<iframe
			src={`https://www.youtube.com/embed/${videoId}`}
			title="youtube-player"
			width="100%"
			height="100%"
		></iframe>
	);
};

export default YoutubePlayer;
