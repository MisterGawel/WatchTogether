'use client';

import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import Footer from '@/components/layout/footer';
import Navbar from '@/components/layout/navbar';
import { useRouter } from 'next/navigation';
import { createRoom } from '@/lib/createRoom';
import { auth } from '@/app/firebase';


export default function Home() {
	const [roomId, setRoomId] = useState('');
	const router = useRouter();

	const handleCreateRoom = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const user = auth.currentUser;
			const uid = user?.uid || null;
	
			const id = await createRoom(roomId, null, uid);
			router.push(`/rooms/${id}`);
		} catch (err) {
			console.error(err);
			alert("Erreur lors de la création");
		}
	};
	
	

	return (
		<div className="flex flex-col min-h-screen">
			<Navbar />

			<section className="container flex-1 w-full py-12 mx-auto md:py-24 lg:py-32">
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
						<div className="overflow-hidden border shadow-xl aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="p-6 text-center">
									<div className="flex items-center justify-center mx-auto mb-4 rounded-full size-16 bg-primary/20">
										<div className="flex items-center justify-center rounded-full size-10 bg-primary">
											<span className="font-bold text-primary-foreground">
												W
											</span>
										</div>
									</div>
									<p className="text-muted-foreground">
										Aperçu de l&apos;interface
									</p>
								</div>
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
