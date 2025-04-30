'use client';

import { motion } from 'framer-motion';
import {
	Video,
	Gamepad2,
	Music,
	Film,
	Users,
	Mic2,
	Headphones,
	MonitorPlay,
	Tv,
} from 'lucide-react';

export default function ListsLayout({
	children,
	modal,
}: {
	children: React.ReactNode;
	modal: React.ReactNode;
}) {
	return (
		<div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
			<motion.div
				className="absolute top-[-150px] left-[-100px] w-[400px] h-[400px] bg-indigo-400 opacity-40 rounded-full blur-2xl"
				animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
				transition={{
					duration: 8,
					repeat: Infinity,
					repeatType: 'loop',
					ease: 'easeInOut',
				}}
			/>
			<motion.div
				className="absolute bottom-[-200px] right-[-150px] w-[500px] h-[500px] bg-purple-400 opacity-30 rounded-full blur-2xl"
				animate={{ y: [0, -30, 0], x: [0, -15, 0] }}
				transition={{
					duration: 10,
					repeat: Infinity,
					repeatType: 'loop',
					ease: 'easeInOut',
				}}
			/>
			<motion.div
				className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-pink-400 opacity-20 rounded-full blur-xl transform -translate-x-1/2 -translate-y-1/2"
				animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
				transition={{
					duration: 12,
					repeat: Infinity,
					repeatType: 'loop',
					ease: 'easeInOut',
				}}
			/>

			{[
				{
					Icon: Video,
					position: 'top-1/3 left-8',
					color: 'text-indigo-400',
					size: 48,
				},
				{
					Icon: Gamepad2,
					position: 'top-[15%] left-[15%]',
					color: 'text-purple-400',
					size: 44,
				},
				{
					Icon: Music,
					position: 'top-[60%] left-[10%]',
					color: 'text-pink-400',
					size: 42,
				},
				{
					Icon: Film,
					position: 'top-[80%] left-[20%]',
					color: 'text-blue-400',
					size: 46,
				},
				{
					Icon: MonitorPlay,
					position: 'top-[15%] right-[15%]',
					color: 'text-indigo-300',
					size: 48,
				},
				{
					Icon: Mic2,
					position: 'top-[40%] right-[10%]',
					color: 'text-purple-300',
					size: 40,
				},
				{
					Icon: Headphones,
					position: 'top-[65%] right-[12%]',
					color: 'text-pink-300',
					size: 44,
				},
				{
					Icon: Tv,
					position: 'bottom-10 right-8',
					color: 'text-blue-300',
					size: 46,
				},
				{
					Icon: Users,
					position: 'bottom-[15%] left-[45%]',
					color: 'text-indigo-300',
					size: 40,
				},
			].map(({ Icon, position, color, size }, idx) => (
				<motion.div
					key={idx}
					className={`absolute ${position} ${color} opacity-40`}
					animate={{ y: [0, 12, 0], rotate: [0, 5, -5, 0] }}
					transition={{
						duration: 6 + (idx % 3),
						repeat: Infinity,
						repeatType: 'loop',
						ease: 'easeInOut',
					}}
				>
					<Icon size={size} />
				</motion.div>
			))}

			<div className="relative z-10">
				{children}
				{modal}
			</div>
		</div>
	);
}
