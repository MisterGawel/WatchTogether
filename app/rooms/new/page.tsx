'use client';

import React, { useEffect, useState } from 'react';
import { Card, Image } from '@heroui/react';
import { motion } from 'framer-motion';
import { db, auth } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface RoomInfo {
    id: string;
    name: string;
}

export default function UserRoomsPage() {
    const [rooms, setRooms] = useState<RoomInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const roomImage = 'https://heroui.com/images/hero-card-complete.jpeg';

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
            if (currentUser) {
                setUser(currentUser);
                fetchUserRooms(currentUser.uid);
            } else {
                setUser(null);
                setRooms([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchUserRooms = async (userId: string) => {
        setLoading(true);
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const roomsMap = userData.rooms || {};
                const roomIds = Object.keys(roomsMap);

                const roomsWithNames = await Promise.all(
                    roomIds.map(async (roomId) => {
                        const roomRef = doc(db, 'rooms', roomId);
                        const roomSnap = await getDoc(roomRef);
                        if (roomSnap.exists()) {
                            return {
                                id: roomId,
                                name: roomSnap.data().name || 'Sans nom'
                            };
                        }
                        return {
                            id: roomId,
                            name: 'Room inconnue'
                        };
                    })
                );

                setRooms(roomsWithNames);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoomClick = (roomId: string) => {
        router.push(`/rooms/new/${roomId}`);
    };

    return (
        <div className="min-h-screen px-4 py-10 bg-gray-50">
            <div className="mx-auto mb-10 max-w-7xl">
                <h1 className="text-4xl font-bold text-gray-800">
                    <center>Mes Rooms</center>
                </h1>
                
            </div>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                        <p className="text-gray-600">
                            Chargement de vos rooms...
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 mx-auto md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
                    {rooms.length > 0 ? (
                        rooms.map((room, index) => (
                            <motion.div
                                key={room.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: index * 0.05,
                                    duration: 0.3,
                                    ease: 'easeOut',
                                }}
                                className="relative cursor-pointer"
                                onClick={() => handleRoomClick(room.id)}
                            >
                                <Card className="overflow-hidden transition-all duration-300 border border-gray-200 shadow-sm rounded-2xl hover:shadow-lg hover:border-gray-300 p-0 h-full">
                                    <div className="relative h-full">
                                        {/* Image de fond */}
                                        <div className="opacity-90 h-full">
                                            <Image
                                                src={roomImage}
                                                alt={`Image de ${room.name}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute top-3 left-[5%]  bg-opacity-50 text-white px-2 py-1 rounded-lg">
											<h2 className="text-2xl font-semibold truncate">  
												{room.name}
											</h2>
										</div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-3 py-10 text-center">
                            <p className="text-gray-600">
                                {user 
                                    ? "Vous n'avez aucune room pour le moment"
                                    : "Connectez-vous pour voir vos rooms"}
                            </p>
                            {!user && (
                                <button 
                                    onClick={() => router.push('/login')}
                                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Se connecter
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}