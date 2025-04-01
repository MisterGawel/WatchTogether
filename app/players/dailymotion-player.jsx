const DailyMotionPlayer = ({ videoId }) => (
    <iframe
        src={`https://geo.dailymotion.com/player.html?video=${videoId}`}
        title='dailymotion-player'
        width="100%"
        height="100%"
    ></iframe>
);

export default DailyMotionPlayer;