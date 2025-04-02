import type React from 'react';
import './styles/globals.css';
import ThemeProvider from './providers';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/firebase';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'WatchToGamer - Regardez et jouez ensemble',
	description:
		'Partagez vos jeux vidéo et vidéos en temps réel avec vos amis. Synchronisez vos expériences et discutez en direct.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	onAuthStateChanged(auth, (user) => {
		if (user) {
			console.log('Utilisateur détecté au chargement :', user);
		} else {
			console.log('Aucun utilisateur détecté après refresh.');
		}
	});

	return (
		<html lang="fr" suppressHydrationWarning>
			<body className={inter.className}>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
