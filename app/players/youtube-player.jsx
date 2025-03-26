const YoutubePlayer = ({ videoId }) => {
    return (
        <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title='youtube-player'
        ></iframe>
    );
    }

export default YoutubePlayer;