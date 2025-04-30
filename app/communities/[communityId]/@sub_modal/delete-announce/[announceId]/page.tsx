import DeleteAnnounceClient from './client';

export default async function DeleteAnnounceModal({
	params,
	searchParams,
}: {
	params: Promise<{ communityId: string }>;
	searchParams: Promise<{ index?: string }>;
}) {
	const { communityId } = await params;
	const { index } = await searchParams;

	if (!communityId) {
		return null;
	}

	return (
		<DeleteAnnounceClient
			communityId={communityId}
			index={index ? parseInt(index) : undefined}
		/>
	);
}
