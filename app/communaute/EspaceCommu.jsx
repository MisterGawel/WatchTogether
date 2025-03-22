'use client'
import { useState } from 'react';
import ChatCommu from './chat';
import { Card } from '@heroui/card'; 
import { Button } from '@heroui/button'; 
import { Input } from '@heroui/input'; 


/* structure de données d'espace communautaire 
    -ensemble de message avec un user associée (chat)
    -ensemble d'annonce 
    -ensemble de Salle vidéo (Card) avec une image ou preview de la vidéo
    -ensemble d'utilisateur de la commu (avec des admin et des users) 
*/
export default function CommunitySpace({ Message, Annonce ,Room}) {
  const Role = "admin"; // À récupérer dynamiquement avec une BDD
  
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
    <div className="flex min-h-screen bg-gray-100">
      {/* Section Annonces */}
      <div className="w-2/3 bg-gray-200 p-4 overflow-y-auto">
        
        {Role === "admin" && (  
          <div className="mb-4">
            <Card className="shadow-lg p-4">
              <h3 className="text-lg font-semibold">Ajouter une annonce</h3>
              <Input
                value={newAnnonce}
                onChange={(e) => setNewAnnonce(e.target.value)}
                placeholder="Écrire une annonce..."
                className="w-full mt-2"
              />
              <Button onClick={addAnnonce} className="mt-2 w-full">
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
              {Role === "admin" && (
                <Button
                  onClick={() => deleteAnnonce(annonce.id)}
                  className="mt-2 text-red-500 text-sm underline"
                >
                  Supprimer
                </Button>
              )}
            </Card>
          </div>
        ))}

        {/* Section Cartes (Événements, Infos, etc.) */}
        <h2 className="text-xl font-bold mt-6 mb-4">Événements & Infos</h2>

        {Role === "admin" && (
          <div className="mb-4">
            <Card className="shadow-lg p-4">
              <h3 className="text-lg font-semibold">Ajouter une carte</h3>
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

        <div className="grid grid-cols-2 gap-4">
          {cards.map((card) => (
            <Card key={card.id} className="shadow-lg p-4">
              <img src={card.image} alt="Event" className="w-full h-32 object-cover rounded-md" />
              <p className="mt-2 text-gray-700">{card.text}</p>
              {Role === "admin" && (
                <Button
                  onClick={() => deleteCard(card.id)}
                  className="mt-2 text-red-500 text-sm underline"
                >
                  Supprimer
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Section Chat */}
      <div className="flex-1 bg-white p-4">
        <ChatCommu Message={Message} />
      </div>
    </div>
  );
}
