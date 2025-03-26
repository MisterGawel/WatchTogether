'use client'
import { useState } from 'react';
import ChatCommu from './chat';
import {Card, CardHeader, CardBody, Image} from "@heroui/react";
import { Button } from '@heroui/button'; 
import { Input } from '@heroui/input'; 


/* structure de données d'espace communautaire 
    -ensemble de message avec un user associée (chat)
    -ensemble d'annonce 
    -ensemble de Salle vidéo (Card) avec une image ou preview de la vidéo
    -ensemble d'utilisateur de la commu (avec des admin et des users) 
*/
export default function CommunitySpace({ Message, Annonce ,Room}) {
  const role = "admin"; // À récupérer dynamiquement avec une BDD
  const NomCommu = "La Communaute "
  // State pour les annonces
  const [annonces, setAnnonces] = useState(Annonce);
  const [newAnnonce, setNewAnnonce] = useState('');

  // State pour les cartes
  const [cards, setCards] = useState(Room);
  //changer BDD
  const [newCardText, setNewCardText] = useState('');
  const [newCardImage, setNewCardImage] = useState('');

  // Ajouter une annonce
  const addAnnonce = () => {
    if (newAnnonce.trim() !== '') {
        //changer BDD
      const newAnnonceObj = { id: Date.now(), text: newAnnonce };
      setAnnonces([...annonces, newAnnonceObj]);
      setNewAnnonce('');
    }
  };

  // Supprimer une annonce
  const deleteAnnonce = (id) => {
    //changer BDD
    setAnnonces(annonces.filter((annonce) => annonce.id !== id));
  };

  // Ajouter une carte
  const addCard = () => {
    
    if (newCardText.trim() !== '' && newCardImage.trim() !== '') {
        //changer BDD
      const newCardObj = { id: Date.now(), image: newCardImage, text: newCardText };
      setCards([...cards, newCardObj]);
      setNewCardText('');
      setNewCardImage('');
    }
  };

  // Supprimer une carte
  const deleteCard = (id) => {
    setCards(cards.filter((card) => card.id !== id));
  };

   return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* En-tête avec le nom de la communauté */}
      <header className="bg-gray-400 text-black py-4 text-center text-2xl font-bold shadow-md">
        {NomCommu}
      </header>

      <div className="flex flex-grow">
        {/* Section Annonces et Cartes */}
        <div className="w-2/3 bg-gray-100 p-4 overflow-y-auto">
          
          {/* Ajouter une annonce (visible uniquement pour l'admin) */}
          {role === "admin" && (  
            <div className="mb-4">
              <Card className="shadow-lg p-4">
                <h3 className="text-lg font-semibold">Ajouter une annonce</h3>
                <Input
                  value={newAnnonce}
                  onChange={(e) => setNewAnnonce(e.target.value)}
                  placeholder="Écrire une annonce..."
                  className="w-full mt-2"
                />
                <Button onPress={addAnnonce} className="mt-2 w-full">
                  Ajouter l'annonce
                </Button>
              </Card>
            </div>
          )}

          <h2 className="text-xl font-bold mb-4">Annonces</h2>
          {annonces.map((annonce) => (
            <div key={annonce.id} className="mb-4">
              <Card className="shadow-lg p-4">
                <h3 className="text-lg font-semibold">Annonce</h3>
                <p className="mt-2 text-gray-700">{annonce.text}</p>
                {role === "admin" && (
                  <Button
                    onPress={() => deleteAnnonce(annonce.id)}
                    size="sm"
                    variant="light"
                    color="danger"
                    className="mt-2"
                    >
                    Supprimer
                    </Button>
                )}
              </Card>
            </div>
          ))}

          {/* Section Cartes (Événements, Infos, etc.) */}
          <h2 className="text-xl font-bold mt-6 mb-4">Salles</h2>

          {role === "admin" && (
            <div className="mb-4">
              <Card className="shadow-lg p-4">
                <h3 className="text-lg font-semibold">Ajouter une Salle</h3>
                <Input
                  value={newCardImage}
                  onChange={(e) => setNewCardImage(e.target.value)}
                  placeholder="URL de l'image..."
                  className="w-full mt-2"
                />
                <Input
                  value={newCardText}
                  onChange={(e) => setNewCardText(e.target.value)}
                  placeholder="Description..."
                  className="w-full mt-2"
                />
                <Button onClick={addCard} className="mt-2 w-full">
                  Ajouter la carte
                </Button>
              </Card>
            </div>
          )}

          {/* Affichage des cartes

          */}
          <div className="grid grid-cols-3 gap-4">
            {cards.map((card) => (
              <Card key={card.id} className="shadow-lg py-4">
                <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                    <h4 className="font-bold text-large">{card.text}</h4>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                    
                <Image src={card.image} alt="Salle" className="object-cover rounded-xl" width={270} />
                {role === "admin" && (
                    <Button
                    onPress={() => deleteCard(card.id)}
                    size="sm"
                    variant="light"
                    color="danger"
                    className="mt-2"
                    >
                    Supprimer
                    </Button>
                )}
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Section Chat */}
        <div className="flex-1 bg-grey-100 p-4">
          <ChatCommu Message={Message} Role={role}/>
        </div>
      </div>
    </div>
  );
}