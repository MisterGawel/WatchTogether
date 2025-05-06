import CommunitySpaceContent from './CommunitySpace';

export default async function CommunitySpace({
	params,
}: {
	params: Promise<{ communityId: string }>;
}) {
	const { communityId } = await params;

	return (
		<div className="flex flex-col w-full h-full">
			<CommunitySpaceContent communityId={communityId} />
		</div>
	);
}
