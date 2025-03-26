'use client';

import type React from 'react';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [roomId, setRoomId] = useState('');
	const router = useRouter();

	const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

	const handleCreateRoom = (e: React.FormEvent) => {
		e.preventDefault();
		// Ici, vous pourriez ajouter la logique pour créer une room
		alert(`Room créée avec l'ID: ${roomId || 'généré automatiquement'}`);
	};

	return (
		<div className="flex flex-col min-h-screen">
			{/* Navbar */}
			<header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container flex items-center justify-between h-16">
					<Link href="/" className="flex items-center gap-2">
						<motion.div
							initial={{ rotate: -10, scale: 0.9 }}
							animate={{ rotate: 0, scale: 1 }}
							transition={{ duration: 0.5 }}
						>
							<div className="flex items-center justify-center rounded-full size-8 bg-primary">
								<span className="font-bold text-primary-foreground">
									W
								</span>
							</div>
						</motion.div>
						<motion.span
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2, duration: 0.5 }}
							className="text-xl font-bold"
						>
							WatchToGamer
						</motion.span>
					</Link>

					{/* Desktop Navigation */}
					<nav className="items-center hidden gap-6 md:flex">
						<Link
							href="#"
							className="text-sm font-medium transition-colors hover:text-primary"
						>
							Comment ça marche
						</Link>
						<Link
							href="#"
							className="text-sm font-medium transition-colors hover:text-primary"
						>
							Fonctionnalités
						</Link>
						<Link
							href="#"
							className="text-sm font-medium transition-colors hover:text-primary"
						>
							À propos
						</Link>
						<div className="flex items-center gap-2">
							<Button
								variant="bordered"
								size="sm"
								onPress={() => router.push('/auth/login')}
							>
								Se connecter
							</Button>
							<Button
								size="sm"
								onPress={() => router.push('/auth/register')}
							>
								S&apos;inscrire
							</Button>
						</div>
					</nav>

					{/* Mobile Menu Button */}
					<button className="md:hidden" onClick={toggleMenu}>
						<Menu
							className={`h-6 w-6 ${isMenuOpen ? 'hidden' : 'block'}`}
						/>
						<X
							className={`h-6 w-6 ${isMenuOpen ? 'block' : 'hidden'}`}
						/>
					</button>
				</div>

				{/* Mobile Navigation */}
				<motion.div
					initial={false}
					animate={{
						height: isMenuOpen ? 'auto' : 0,
						opacity: isMenuOpen ? 1 : 0,
					}}
					transition={{ duration: 0.3 }}
					className="overflow-hidden md:hidden"
				>
					<div className="container flex flex-col gap-4 py-4">
						<Link
							href="#"
							className="text-sm font-medium transition-colors hover:text-primary"
						>
							Comment ça marche
						</Link>
						<Link
							href="#"
							className="text-sm font-medium transition-colors hover:text-primary"
						>
							Fonctionnalités
						</Link>
						<Link
							href="#"
							className="text-sm font-medium transition-colors hover:text-primary"
						>
							À propos
						</Link>
						<div className="flex flex-col gap-2">
							<Button
								variant="bordered"
								size="sm"
								className="w-full"
							>
								Se connecter
							</Button>
							<Button size="sm" className="w-full">
								S&apos;inscrire
							</Button>
						</div>
					</div>
				</motion.div>
			</header>

			{/* Hero Section */}
			<section className="container flex-1 py-12 md:py-24 lg:py-32">
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
						<p className="text-xl text-muted-foreground">
							Partagez vos jeux vidéo et vidéos en temps réel avec
							vos amis. Synchronisez vos expériences et discutez
							en direct.
						</p>

						{/* Room Creation Form */}
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
										placeholder="Entrez un ID de room (optionnel)"
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
									className="h-10 gap-2 rounded-lg"
								>
									Créer une room
									<ArrowRight className="w-4 h-4" />
								</Button>
							</form>
							<p className="mt-2 text-sm text-muted-foreground">
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

						{/* Decorative elements */}
						<div className="absolute rounded-full -z-10 -top-6 -right-6 size-24 bg-primary/10 blur-xl"></div>
						<div className="absolute rounded-full -z-10 -bottom-10 -left-10 size-32 bg-primary/10 blur-xl"></div>
					</motion.div>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-6 border-t md:py-8">
				<div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
					<div className="flex items-center gap-2">
						<div className="flex items-center justify-center rounded-full size-6 bg-primary">
							<span className="text-xs font-bold text-primary-foreground">
								W
							</span>
						</div>
						<span className="text-sm font-medium">
							WatchToGamer
						</span>
					</div>
					<p className="text-sm text-muted-foreground">
						© {new Date().getFullYear()} WatchToGamer. Tous droits
						réservés.
					</p>
				</div>
			</footer>
		</div>
	);
}
