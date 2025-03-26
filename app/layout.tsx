import type React from 'react';
import './styles/globals.css';
import ThemeProvider from './providers';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

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
	return (
		<html lang="fr" suppressHydrationWarning>
			<body className={inter.className}>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
