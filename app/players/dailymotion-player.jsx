const DailyMotionPlayer = ({ videoId }) => (
    <iframe
        src={`https://geo.dailymotion.com/player.html?video=${videoId}`}
        allow="autoplay; fullscreen"
        allowFullScreen
    ></iframe>
);

export default DailyMotionPlayer;