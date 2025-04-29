import CreateRoomClient from './client';

export default async function CreateRoomModal({
	params,
}: {
	params: Promise<{ communityId: string }>;
}) {
	const { communityId } = await params;

	if (!communityId) {
		return null;
	}

	return <CreateRoomClient communityId={communityId} />;
}
