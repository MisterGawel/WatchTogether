'use client';
import Image from 'next/image';
import watchtogether from '@/public/watch-together.jpg';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AuthLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="flex w-full h-full">
			<div className="w-3/5 h-screen bg-blue-100">
				<Image
					src={watchtogether}
					alt="watch-together"
					className="object-cover w-full h-full"
				/>
			</div>
			<div className="relative flex items-center w-2/5 h-screen text-center bg-white">
				<div className="absolute left-0 flex items-center justify-center w-full h-16 bg-white top-8">
					<Link href="/" className="flex items-center gap-2 ">
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
					</Link>
				</div>
				{children}
			</div>
		</div>
	);
}
