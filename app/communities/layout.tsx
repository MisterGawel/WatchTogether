// app/communities/layout.tsx
'use client';

export default function CommunitiesLayout({
	children,
	modal,
}: {
	children: React.ReactNode;
	modal?: React.ReactNode;
}) {
	return (
		<div className="relative">
			{children}

			{modal}
		</div>
	);
}
