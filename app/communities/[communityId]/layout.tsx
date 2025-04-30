'use client';

export default function ListsLayout({
	children,
	sub_modal,
}: {
	children: React.ReactNode;
	sub_modal: React.ReactNode;
}) {
	return (
		<div className="relative min-h-screen overflow-hidden">
			<div className="relative z-10">
				{children}
				{sub_modal}
			</div>
		</div>
	);
}
