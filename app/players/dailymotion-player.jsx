const DailyMotionPlayer = ({ videoId }) => (
    <iframe
        src={`https://geo.dailymotion.com/player.html?video=${videoId}`}
        title='dailymotion-player'
    ></iframe>
);

export default DailyMotionPlayer;