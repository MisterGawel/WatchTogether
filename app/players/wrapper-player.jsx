const WrapperPlayer = ({ Player, videoId }) => {

    return (
        <div className='relative w-full h-full'>
            <Player videoId={videoId} channel={videoId} />
        </div>
    );
};

export default WrapperPlayer;