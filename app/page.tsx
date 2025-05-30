'use client';

import type React from 'react';
import { useState,useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import Footer from '@/components/layout/footer';
import Navbar from '@/components/layout/navbar';
import { useRouter } from 'next/navigation';
import { createRoom } from '@/lib/createRoom';
import { auth } from '@/app/firebase';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

import Image from 'next/image';
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

export default function Home() {
	const [roomId, setRoomId] = useState('');
	const router = useRouter();

	//Vérification de la tentative de connexion a une salle inexistante
	const hasShownToast = useRef(false);

	useEffect(() => {
	  const params = new URLSearchParams(window.location.search);
	  const error = params.get('error');
	
	  if (error === 'room-not-found' && !hasShownToast.current) {
		toast.error('La salle n\'existe pas ou a été supprimée.');
		hasShownToast.current = true;
	  }
	}, []);
	

	const handleCreateRoom = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const user = auth.currentUser;
			const uid = user?.uid || null;

			const id = await createRoom(roomId, null, uid);
			router.push(`/rooms/${id}`);
		} catch (err) {
			console.error(err);
			alert('Erreur lors de la création');
		}
	};

	return (
		<div className="relative flex flex-col h-full min-h-screen overflow-hidden ">
			<Toaster/>
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
			<Navbar />

			<section className="container relative z-10 flex-1 w-full h-full py-12 mx-auto md:py-24 lg:py-32">
				<div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="flex flex-col gap-4"
					>
						<h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
							Regardez et jouez{' '}
							<span className="text-primary">ensemble</span>
						</h1>
						<p className="text-xl text-popover-foreground">
							Partagez vos jeux vidéo et vidéos en temps réel avec
							vos amis. Synchronisez vos expériences et discutez
							en direct.
						</p>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.6 }}
							className="mt-6"
						>
							<form
								onSubmit={handleCreateRoom}
								className="flex flex-col gap-2 sm:flex-row"
							>
								<div className="flex-1">
									<Input
										type="text"
										placeholder="Entrez un nom de room (ex: ma-room)"
										value={roomId}
										onChange={(e) =>
											setRoomId(e.target.value)
										}
										classNames={{
											inputWrapper:
												'!rounded-lg bg-content1 text-foreground',
										}}
										className="h-12"
									/>
								</div>
								<Button
									type="submit"
									size="lg"
									className="h-10 gap-2 rounded-lg bg-primary text-primary-foreground"
								>
									Créer une room
									<ArrowRight className="w-4 h-4" />
								</Button>
							</form>
							<p className="mt-2 text-sm text-popover-foreground">
								Aucun compte requis. Créez une room et invitez
								vos amis en partageant le lien.
							</p>
						</motion.div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.2, duration: 0.6 }}
						className="relative"
					>
						<div className="relative z-50 overflow-hidden border shadow-xl aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
							<div className="absolute inset-0 z-50 flex items-center justify-center">
								<Image
									src="/image.png"
									alt="Hero Image"
									width={800}
									height={450}
									className="object-cover w-full h-full rounded-xl"
								/>
							</div>
						</div>
						<div className="absolute z-10 rounded-full -top-6 -right-6 size-24 bg-primary/10 blur-xl"></div>
						<div className="absolute z-10 rounded-full -bottom-10 -left-10 size-32 bg-primary/10 blur-xl"></div>
					</motion.div>
				</div>
			</section>

			<Footer />
		</div>
	);
}
