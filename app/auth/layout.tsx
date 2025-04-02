'use client';
import Image from 'next/image';
import watchtogether from '@/public/watch-together.jpg';
import { useRouter } from 'next/navigation';

export default function AuthLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const router = useRouter();
	return (
		<div className="flex w-full h-full">
			<div className="w-3/5 h-screen bg-blue-100">
				<Image
					src={watchtogether}
					alt="watch-together"
					className="object-cover w-full h-full"
				/>
			</div>
			<div className="grid w-2/5 h-screen bg-white grid-rows-[auto_1fr_auto] items-center text-center">
				<h1
					className="pt-16 text-xl font-bold text-blue-700 cursor-pointer hover:opacity-70"
					onClick={() => router.push('/')}
				>
					WatchToGamer
				</h1>
				{children}
				<h1 className="pb-16 text-xs font-normal text-gray-400">
					Réalisé par <br /> A. Gaël & L. Alexis & R. Lucas & R.
					Nicolas
				</h1>
			</div>
		</div>
	);
}
