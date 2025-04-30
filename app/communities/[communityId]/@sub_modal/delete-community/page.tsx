import DeleteCommunityClient from './client';

export default async function DeleteCommunityModal({
	params,
}: {
	params: Promise<{ communityId: string }>;
}) {
	const { communityId } = await params;

	if (!communityId) {
		return null;
	}

	return <DeleteCommunityClient communityId={communityId} />;
}
