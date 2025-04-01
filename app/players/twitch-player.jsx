const TwitchPlayer = ( { channel } ) => {
    return (
        <iframe
        src={`https://player.twitch.tv/?channel=${channel}&parent=localhost`}
        title='twitch-player'
        >
        </iframe>
    );
    }

export default TwitchPlayer;