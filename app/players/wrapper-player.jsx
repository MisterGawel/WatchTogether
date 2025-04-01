import YoutubePlayer from "./youtube-player";
import DailymotionPlayer from "./dailymotion-player";
import TwitchPlayer from "./twitch-player";

const WrapperPlayer = ({ link }) => {

    // Get the domain name from the URL
    const url = new URL(link);
    const domain = url.hostname.replace('www.', '');

    function getVideoId(url) {
        //Youtube example : https://www.youtube.com/watch?v=jfKfPfyJRdk
        if (domain === 'youtube.com') {
            const searchParams = new URLSearchParams(url.search);
            return searchParams.get('v');
        }

        //Dailymotion example : https://www.dailymotion.com/video/x9g8p00
        if (domain === 'dailymotion.com') {
            return url.pathname.split('/')[2];
        }

        //Twitch example : https://www.twitch.tv/sixentv
        if (domain === 'twitch.tv') {
            return url.pathname.split('/')[1];
        }
    }

    if (domain === 'youtube.com') {
        return (
            <YoutubePlayer videoId={getVideoId(url)} />
        );
    }

    else if (domain === 'dailymotion.com') {
        return (
            <DailymotionPlayer videoId={getVideoId(url)} />
        );
    }

    else if (domain === 'twitch.tv') {
        return (
            <TwitchPlayer channel={getVideoId(url)} />
        );
    }

    else {
        return (
            <div>Video not supported</div>
        );
    }
};

export default WrapperPlayer;