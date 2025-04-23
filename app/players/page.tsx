import WrapperPlayer from './wrapper-player.jsx';

export default function Home() {
	return (
		<div>
			<main className="">
				<WrapperPlayer link={'https://www.twitch.tv/BDECERI'} />
				<WrapperPlayer
					link={'https://www.youtube.com/watch?v=6n3pFFPSlW4'}
				/>
				<WrapperPlayer
					link={'https://www.dailymotion.com/video/x7s7z9d'}
				/>
			</main>
		</div>
	);
}
