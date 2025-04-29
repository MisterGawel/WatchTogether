export default function ListsLayout({
	children,
	modal,
}: {
	children: React.ReactNode;
	modal?: React.ReactNode;
}) {
	return (
		<div className="relative">
			{children}
			{modal && modal}
		</div>
	);
}
