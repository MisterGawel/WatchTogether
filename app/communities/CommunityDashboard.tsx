// components/CommunityDashboard.tsx
'use client';

import { Card } from '@heroui/react';
import { Button } from '@heroui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface DashboardProps {
	totalCount: number;
	userCount: number;
}

export function CommunityDashboard({ totalCount, userCount }: DashboardProps) {
	const cards = [
		{
			title: 'Toutes les communautés',
			subtitle: `${totalCount} au total`,
			href: '/communities/all-communities',
		},
		{
			title: 'Mes communautés',
			subtitle: `${userCount} auxquelles je participe`,
			href: '/communities/my-communities',
		},
		{
			title: 'Créer une nouvelle communauté',
			subtitle: 'Lancez votre espace !',
			href: '/communities/create',
		},
	];

	return (
		<div className="flex flex-col items-center mb-12">
			<div className="grid w-full max-w-5xl gap-8 md:grid-cols-3">
				{cards.map((c, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1, duration: 0.4 }}
					>
						<Card className="items-center justify-center h-full p-8 text-center shadow-lg cursor-pointer aspect-square rounded-2xl hover:shadow-xl">
							<h3 className="mb-2 text-2xl font-bold">
								{c.title}
							</h3>
							<p className="mb-4 text-gray-500">{c.subtitle}</p>
							<Button
								color="primary"
								size="lg"
								href={c.href}
								as={Link}
							>
								Aller
							</Button>
						</Card>
					</motion.div>
				))}
			</div>
		</div>
	);
}
