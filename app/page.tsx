import WrapperPlayer from './players/wrapper-player';
import YoutubePlayer from './players/youtube-player';
import DailymotionPlayer from './players/dailymotion-player';
import TwitchPlayer from './players/twitch-player';

export default function Home() {
	return (
		<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-blue-100">
			<main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-star">
				<WrapperPlayer  Player={YoutubePlayer} videoId="GFyLTpYUFog" />
				<WrapperPlayer  Player={DailymotionPlayer} videoId="xkozj2"/>
				<WrapperPlayer  Player={TwitchPlayer} videoId="skyart" />
			</main>
		</div>
	);
}
