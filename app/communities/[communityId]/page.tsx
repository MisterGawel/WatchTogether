import CommunitySpaceContent from './CommunitySpace';

export default function CommunitySpace({
	params,
}: {
	params: { communityId: string };
}) {
	const { communityId } = params;

	return (
		<div className="flex flex-col w-full h-full">
			<CommunitySpaceContent communityId={communityId} />
		</div>
	);
}
