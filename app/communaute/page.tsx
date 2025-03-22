import Image from 'next/image';
import { Button, ButtonGroup } from "@heroui/button";
import ChatCommu from './chat';
import CommunitySpace from './EspaceCommu'
export default function Home() {
	//Base temporaire
	  const message = [
		{ id: 1, text: "Bienvenue sur le chat!", user: "System" },
		{ id: 2, text: "Test d'utilisateur", user: "User1" },
		{ id: 3, text: "Salut tout le monde ! Comment ça va ?", user: "User2" },
		{ id: 4, text: "Ça va bien, merci ! Et toi ?", user: "User2" },
		{ id: 5, text: "Très bien aussi, merci ! Quoi de neuf ?", user: "User2" },
		{ id: 6, text: "Pas grand-chose, juste une journée chargée.", user: "User1" },
		{ id: 7, text: "Oh, je comprends ! Moi aussi, une journée assez intense.", user: "User2" },
		{ id: 8, text: "Vous avez des projets pour ce week-end ?", user: "User2" },
		{ id: 9, text: "Je vais probablement me détendre à la maison. Et vous ?", user: "User2" },
		{ id: 10, text: "Je vais visiter une expo d'art moderne.", user: "User1" },
		{ id: 11, text: "Ça a l'air super ! J'espère que tu vas passer un bon moment.", user: "User2" },

	  ];
	  const annonce = [
		{ id: 1, text: 'Rejoignez-nous pour notre réunion communautaire demain à 18h!' },
	  ]
	  const room =[
		{ id: 1, image: 'next.svg', text: 'Événement spécial ce week-end !' },
	  ]
	return (
		<div className="">
			<main className="">
				<CommunitySpace Message={message} Annonce = {annonce} Room={room} ></CommunitySpace>
			</main>
		</div>
	);
}
