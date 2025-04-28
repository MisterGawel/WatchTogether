import {
	Card,
	CardHeader,
	CardBody,
	Image,
	Button,
	Input,
} from '@heroui/react';

export default function InputAnnonce({
	ValeurChamp,
	role,
	foncNewAnnonce,
	foncaddAnnonce,
}) {
	const image = 'https://heroui.com/images/hero-card-complete.jpeg';
	return (
		role === 'admin' && (
			<div className="mb-4">
				<Card className="p-4 shadow-lg">
					<h3 className="text-lg font-semibold">
						Ajouter une annonce
					</h3>
					<Input
						value={ValeurChamp}
						onChange={foncNewAnnonce}
						placeholder="Écrire une annonce..."
						className="w-full mt-2"
					/>
					<Button onPress={foncaddAnnonce} className="w-full mt-2">
						Ajouter l'annonce
					</Button>
				</Card>
			</div>
		)
	);
}
