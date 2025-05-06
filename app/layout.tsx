import type React from 'react';
import './globals.css';
import { HeroProvider, ThemeProvider } from './providers';
import { Roboto } from 'next/font/google';
import type { Metadata } from 'next';
import '@theme-toggles/react/css/Classic.css';

const roboto = Roboto({ subsets: ['latin'] });

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
	return (
		<html lang="fr" suppressHydrationWarning>
			<body className={roboto.className}>
				<ThemeProvider>
					<HeroProvider>{children}</HeroProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
