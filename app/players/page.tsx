import WrapperPlayer from "./wrapper-player.jsx";
import YoutubePlayer from "./youtube-player.jsx";
import TwitchPlayer from "./twitch-player.jsx";
import DailyMotionPlayer from "react-player/dailymotion.js";

export default function Home() {
    return (
      <div>
            <main className="">
                <WrapperPlayer Player={YoutubePlayer} videoId={"7jYGNkGZxgY"}/>
            </main>
      </div>
    );
  }  