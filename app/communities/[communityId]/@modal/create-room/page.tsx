import CreateAnnonceClient from './client';

export default async function CreateAnnonceModal({
	params,
}: {
	params: Promise<{ communityId: string }>;
}) {
	const { communityId } = await params;

	if (!communityId) {
		return null;
	}

	return <CreateAnnonceClient communityId={communityId} />;
}
