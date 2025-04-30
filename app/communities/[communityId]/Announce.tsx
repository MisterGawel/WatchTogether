import { Card, Button } from '@heroui/react';
import { useRouter } from 'next/navigation';

interface Announce {
	communityId: string;
	announce: string;
	role: string;
	index: number;
}

export default function CardAnnonce({
	communityId,
	announce,
	role,
	index,
}: Announce) {
	const router = useRouter();
	return (
		<div className="mb-4">
			<Card className="p-4 shadow-none bg-background">
				<p className="text-gray-700 ">{announce}</p>
				{role === 'admin' && (
					<Button
						isIconOnly
						size="sm"
						variant="light"
						color="danger"
						onPress={() => {
							router.push(
								`/communities/${communityId}/delete-announce/${announce}?index=${index}`
							);
						}}
						className="absolute text-lg leading-none top-1 right-1"
					>
						×
					</Button>
				)}
			</Card>
		</div>
	);
}
