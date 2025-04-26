'use client'
import { Card, CardHeader, CardBody, Image, Button } from '@heroui/react';
import { useRouter } from 'next/navigation';

export default function CardRoom({ room, role, Suppresion, id }) {
	const image = 'https://heroui.com/images/hero-card-complete.jpeg';
	const router = useRouter();

	return (
		<div className="flex flex-col items-start">
		<Card isPressable  onPress={() => router.push(`/rooms/new/${id}`)}
			className="shadow-lg py-4 cursor-pointer" 
			
		>
			<CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
				<h4 className="font-bold text-large">{room}</h4> {/* Affiche room plutôt */}
			</CardHeader>

			<CardBody  className="overflow-visible py-2">
				<Image
					src={image}
					alt="Salle"
					className="object-cover rounded-xl"
					width={270}
				/>

			</CardBody>
			</Card>
			{role === 'admin' && (
					<Button
					
						onPress={Suppresion}
						size="sm"
						variant="light"
						color="danger"
						className="mt-2 w-full sm:w-auto"
					>
						Supprimer
					</Button>
				)}
		
		</div>
	);
}
