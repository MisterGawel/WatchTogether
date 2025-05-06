export default function Footer() {
	return (
		<footer className="min-w-full border-foreground/10 py-6 md:py-8 border-t backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full flex justify-center">
			<div className="!container flex flex-col items-center mx-auto justify-between  gap-4 sm:flex-row">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium opacity-70">
						Réalisé par A. Gaël & L. Alexis & R. Lucas & R. Nicolas
					</span>
				</div>
				<p className="text-sm text-popover-foreground opacity-70">
					© {new Date().getFullYear()} WatchToGamer. Tous droits
					réservés.
				</p>
			</div>
		</footer>
	);
}
