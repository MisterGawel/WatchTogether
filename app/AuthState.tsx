'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/app/firebase';
import type { User } from 'firebase/auth';
import { Button } from '@heroui/button';
import { useRouter } from 'next/navigation';
import { Avatar } from '@heroui/avatar';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuGroup,
	DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { FaUser, FaUsers } from 'react-icons/fa';
import { LogOut } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const items = [
	{ title: 'Mon profil', url: '/profile', icon: FaUser },
	{ title: 'Mes communautés', url: '/communities', icon: FaUsers },
];

export function AuthState() {
	const [user, setUser] = useState<User | null>(null);
	const [initializing, setInitializing] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const unsub = auth.onAuthStateChanged((u) => {
			setUser(u);
			setInitializing(false);
		});
		return () => unsub();
	}, []);

	if (initializing) {
		return (
			<div className="flex items-center gap-2">
				<Button
					size="sm"
					disabled
					className="relative flex items-center gap-2 px-4 py-2 !bg-transparent !text-gray-400 cursor-not-allowed"
				>
					<Loader2
						className="w-4 h-4 animate-spin"
						aria-hidden="true"
					/>
				</Button>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="flex items-center gap-2">
				<Button
					variant="bordered"
					size="sm"
					className="border-primary text-primary min-w-24"
					onPress={() => router.push('/auth/login')}
				>
					Se connecter
				</Button>
				<Button
					size="sm"
					className="bg-primary text-primary-foreground min-w-24"
					onPress={() => router.push('/auth/register')}
				>
					S’inscrire
				</Button>
			</div>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					size="sm"
					className="bg-primary text-primary-foreground"
				>
					Mon compte
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				sideOffset={4}
				className="min-w-[200px]"
			>
				<DropdownMenuLabel className="flex items-center gap-2 px-2 py-1">
					<Avatar className="w-8 h-8 rounded-lg">
						<img src={user.photoURL || ''} alt="avatar" />
					</Avatar>
					<span className="truncate">{user.email}</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup className="flex flex-col gap-1">
					{items.map((it, i) => (
						<DropdownMenuItem
							key={i}
							onSelect={() => router.push(it.url)}
						>
							<it.icon className="mr-2" /> {it.title}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onSelect={() => {
						auth.signOut();
						router.refresh();
					}}
				>
					<LogOut className="mr-2 text-danger" /> Se déconnecter
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
