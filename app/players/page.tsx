import WrapperPlayer from "./wrapper-player.jsx";
import YoutubePlayer from "./youtube-player.jsx";
import TwitchPlayer from "./twitch-player.jsx";
import DailyMotionPlayer from "react-player/dailymotion.js";

export default function Home() {
    return (
      <div>
            <main className="">
                <WrapperPlayer link={"https://www.twitch.tv/BDECERI"}/>
                <WrapperPlayer link={"https://www.youtube.com/watch?v=6n3pFFPSlW4"}/>
                <WrapperPlayer link={"https://www.dailymotion.com/video/x7s7z9d"}/>
            </main>
      </div>
    );
  }  