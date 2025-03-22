const TwitchPlayer = ( { channel } ) => {
    return (
        <iframe
        src={`https://player.twitch.tv/?channel=${channel}&parent=localhost`}
        allowFullScreen>
        </iframe>
    );
    }

export default TwitchPlayer;