"use client";

const YoutubePlayer = ({ videoId }) => {
    return (
        <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        ></iframe>
    );
    }

export default YoutubePlayer;