import DeleteRoomClient from './client';

export default async function DeleteRoomModal({
	params,
}: {
	params: Promise<{ communityId: string; roomId: string }>;
}) {
	const { communityId, roomId } = await params;

	if (!communityId) {
		return null;
	}

	return <DeleteRoomClient communityId={communityId} roomId={roomId} />;
}
