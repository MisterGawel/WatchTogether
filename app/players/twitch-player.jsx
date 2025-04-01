const TwitchPlayer = ( { channel } ) => {
    return (
        <iframe
        src={`https://player.twitch.tv/?channel=${channel}&parent=localhost`}
        title='twitch-player'
        width="100%"
        height="100%"
        >
        </iframe>
    );
    }

export default TwitchPlayer;