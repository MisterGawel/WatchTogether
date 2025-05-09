'use client';
import { IoIosAddCircle } from 'react-icons/io';
import { AiFillHome } from 'react-icons/ai';
import { RiCommunityFill } from 'react-icons/ri';
import { Card, Divider } from '@heroui/react';
import { Button } from '@heroui/button';
import { motion } from 'framer-motion';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface DashboardProps {
	user?: User | null;
	totalCount: number;
	userCount: number;
}

export function CommunityDashboard({
	user,
	totalCount,
	userCount,
}: DashboardProps) {
	const cards = [
		{
			title: 'Toutes les communautés',
			subtitle: `${totalCount} au total`,
			href: '/communities/all-communities',
			label: 'Voir toutes les communautés',
			icon: RiCommunityFill,
		},
		{
			title: 'Mes communautés',
			subtitle: `${userCount} auxquelles je participe`,
			href: user ? '/communities/my-communities' : '/auth/login',
			label: userCount > 0 ? 'Voir mes communautés' : 'Se connecter',
			icon: AiFillHome,
		},
		{
			title: 'Créer une nouvelle communauté',
			subtitle: 'Lancez votre espace !',
			href: user ? '/communities/create' : '/auth/login',
			label: user ? 'Créer une communauté' : 'Se connecter',
			icon: IoIosAddCircle,
		},
	];

	const router = useRouter();

	return (
		<div className="flex flex-col items-center mb-12">
			<div className="grid items-stretch w-full max-w-5xl gap-8 md:grid-cols-3">
				{cards.map((c, i) => (
					<motion.div
						key={i}
						className="h-full"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1, duration: 0.4 }}
					>
						<Card className="relative flex flex-col justify-center h-full px-8 text-center transition border-b-2 border-gray-200 shadow border-b-background bg-gradient-to-br from-background to-secondary rounded-2xl hover:shadow-lg aspect-square">
							<Divider className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary rounded-t-2xl" />
							<div className="absolute flex items-center justify-center w-12 h-12 mx-auto mb-4 transform -translate-x-1/2 bg-white rounded-full shadow-md text-primary top-8 left-1/2">
								<c.icon className="w-6 h-6" />
							</div>
							<div className="">
								<h3 className="mb-2 text-2xl font-semibold text-foreground">
									{c.title}
								</h3>
								<p className="mb-4 text-foreground opacity-70">
									{c.subtitle}
								</p>
							</div>
							<Button
								className="absolute transform -translate-x-1/2 bottom-10 left-1/2"
								color="primary"
								size="md"
								onPress={() => {
									if (user) {
										router.push(c.href);
									} else {
										router.push('/auth/login');
									}
								}}
							>
								{c.label}
							</Button>
						</Card>
					</motion.div>
				))}
			</div>
		</div>
	);
}
