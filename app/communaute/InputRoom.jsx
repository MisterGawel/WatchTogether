'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom } from '../rooms/new/roomService';
import { Card, Button, Input } from '@heroui/react';
import { getAuth } from 'firebase/auth';

export default function InputRoom({ role, commuID }) {
    const [roomName, setRoomName] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);
    const router = useRouter();

    const communityID = commuID;

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSubmit = async () => {
        if (!roomName.trim()) {
            alert('Veuillez entrer un nom de salle');
            return;
        }

        if (!currentUserId) {
            alert('Utilisateur non connecté');
            return;
        }

        try {
            const roomId = await createRoom(roomName, communityID, currentUserId);
            //router.push(`/rooms/new/${roomId}`);
        } catch (error) {
            console.error('Erreur création room:', error);
            alert('Erreur lors de la création de la salle');
        }
    };

    return (
        role === 'admin' && (
            <div className="mb-4">
                <Card className="shadow-lg p-4">
                    <h3 className="text-lg font-semibold">Ajouter une Salle</h3>
                    <Input
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Nom room"
                        className="w-full mt-2"
                    />
                    <Button onPress={handleSubmit} className="mt-2 w-full">
                        Créer la salle
                    </Button>
                </Card>
            </div>
        )
    );
}