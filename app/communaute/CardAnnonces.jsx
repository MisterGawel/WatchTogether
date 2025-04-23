import { Card, CardHeader, CardBody, Image, Button } from '@heroui/react';

export default function CardAnnonce({ annonce, role, Suppresion }) {
	return (
		<div className="mb-4">
			<Card className="shadow-lg p-4">
				<h3 className="text-lg font-semibold">Annonce</h3>
				<p className="mt-2 text-gray-700">{annonce}</p>
				{role === 'admin' && (
					<Button
						onPress={Suppresion}
						size="sm"
						variant="light"
						color="danger"
						className="mt-2"
					>
						Supprimer
					</Button>
				)}
			</Card>
		</div>
	);
}
