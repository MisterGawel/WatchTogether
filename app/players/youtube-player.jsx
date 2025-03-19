const YoutubePlayer = ({ videoId }) => {
    return (
        <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        ></iframe>
    );
    }

export default YoutubePlayer;