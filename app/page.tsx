"use client"; // <-- Ajoute cette ligne en haut du fichier

import { useEffect, useState } from "react";
import { db } from "../firebase"; // 🔥 Import Firestore
import { collection, getDocs } from "firebase/firestore";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
    const [rooms, setRooms] = useState<any[]>([]); // État pour stocker les rooms
    const [loading, setLoading] = useState<boolean>(true); // Chargement des données

    // Utilisation de useEffect pour récupérer les rooms depuis Firebase
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "rooms"));
                const roomsList = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setRooms(roomsList);
            } catch (error) {
                console.error("Erreur lors de la récupération des rooms:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 space-y-4">
                <Link
                    href="/rooms/new"
                    className={`${buttonVariants({ size: "lg", variant: "outline" })} custom-button`}
                >
                Create Room
                </Link>    

            
            {/* Liste des boutons pour chaque room */}
            <div className="space-y-2 mt-8">
                {rooms.length > 0 ? (
                    rooms.map((room) => (
                        <Link
                            key={room.id}
                            href={`/rooms/new/${room.id}`}
                        >
                            <Button className={`${buttonVariants({ size: "lg", variant: "outline" })} custom-button`}>
                                Open {room.name || "Room"}
                            </Button>
                        </Link>
                    ))
                ) : (
                    <p className="text-gray-700 dark:text-gray-300">No rooms available.</p>
                )}
            </div>
        </div>
    );
}
