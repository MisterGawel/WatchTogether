'use client';
// app/providers.tsx

import { HeroUIProvider } from '@heroui/react';
import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';

export function HeroProvider({ children }: { children: React.ReactNode }) {
	return <HeroUIProvider>{children}</HeroUIProvider>;
}

interface ThemeContextValue {
	isDark: boolean;
	toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [isDark, setIsDark] = useState<boolean | null>(null);

	// Chargement initial
	useEffect(() => {
		const saved = localStorage.getItem('theme');
		if (saved === 'dark' || saved === 'light') {
			setIsDark(saved === 'dark');
		} else {
			setIsDark(
				window.matchMedia('(prefers-color-scheme: dark)').matches
			);
		}
	}, []);

	// Application du thème
	useEffect(() => {
		if (isDark === null) return;
		document.body.classList.toggle('dark', isDark);
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
	}, [isDark]);

	const toggle = () => setIsDark((prev) => (prev === null ? false : !prev));

	// Tant que non déterminé, on peut retourner null ou un loader
	if (isDark === null) return null;

	return (
		<ThemeContext.Provider value={{ isDark, toggle }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
	return ctx;
}
