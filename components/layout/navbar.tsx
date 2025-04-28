import Link from 'next/link';
import { AuthState } from '@/app/AuthState';
import { motion } from 'framer-motion';
import { Classic } from '@theme-toggles/react';
import { useEffect, useState } from 'react';

export default function Navbar() {
	const [isToggled, setToggle] = useState(false);

	useEffect(() => {
		if (isToggled) {
			document.body.classList.add('dark');
		} else {
			document.body.classList.remove('dark');
		}
	}, [isToggled]);

	return (
		<header className="border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full flex justify-center">
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
						className="text-lg font-bold"
					>
						WatchToGamer
					</motion.span>
				</Link>
				<div className="relative flex items-center gap-4">
					<div className="absolute flex items-center gap-2 -left-10">
						{/* @ts-expect-error Toggle */}
						<Classic
							toggled={isToggled}
							toggle={setToggle}
							className="text-xl text-primary"
						/>
					</div>
					<AuthState />
				</div>
			</div>
		</header>
	);
}
