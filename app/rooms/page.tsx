'use client';

import React, { useEffect, useState } from 'react';
import { Card, Image } from '@heroui/react';
import { motion } from 'framer-motion';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface RoomInfo {
  id: string;
  name: string;
  communityId?: string | null;
}

export default function UserRoomsPage() {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'withCommunity' | 'withoutCommunity'>('all');

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
              const roomData = roomSnap.data();
              return {
                id: roomId,
                name: roomData.name || 'Sans nom',
                communityId: roomData.communityId || null,
              };
            }
            return {
              id: roomId,
              name: 'Room inconnue',
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
    router.push(`/rooms/${roomId}`);
  };

  const filteredRooms = rooms
    .filter((room) => room.name !== 'Room inconnue') // Filtrage des rooms inconnues
    .filter((room) => {
      const matchSearch = room.name.toLowerCase().includes(search.toLowerCase());
      const isWithCommunity = !!room.communityId;

      if (filterType === 'withCommunity') return matchSearch && isWithCommunity;
      if (filterType === 'withoutCommunity') return matchSearch && !isWithCommunity;
      return matchSearch;
    });

  const roomsByCommunity: Record<string, RoomInfo[]> = {};
  if (filterType === 'withCommunity') {
    filteredRooms.forEach((room) => {
      const key = room.communityId || 'autres';
      if (!roomsByCommunity[key]) roomsByCommunity[key] = [];
      roomsByCommunity[key].push(room);
    });
  }

  return (
    <div className="min-h-screen px-4 py-10 bg-gray-50">
      <div className="mx-auto mb-10 max-w-7xl">
        <h1 className="text-4xl font-bold text-gray-800 text-center">Mes Rooms</h1>
      </div>

      {/* Barre de recherche + filtre */}
        <div className="flex justify-center items-center gap-4 mb-8 max-w-7xl mx-auto">
        <input
            type="text"
            placeholder="Rechercher une room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full md:w-auto px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
            <option value="all">Toutes les rooms</option>
            <option value="withCommunity">Avec communauté</option>
            <option value="withoutCommunity">Sans communauté</option>
        </select>
        </div>


      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <p className="text-gray-600">Chargement de vos rooms...</p>
          </div>
        </div>
      ) : (
        <>
          {filteredRooms.length === 0 ? (
            <div className="text-center text-gray-600 py-10">
              Aucune room trouvée pour ce filtre.
            </div>
          ) : filterType === 'withCommunity' ? (
            Object.entries(roomsByCommunity).map(([communityId, communityRooms]) => (
              <div key={communityId} className="mb-10 max-w-7xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4 text-indigo-600">
                  Communauté: {communityId}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {communityRooms.map((room, index) => (
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
                          <div className="opacity-90 h-full">
                            <Image
                              src={roomImage}
                              alt={`Image de ${room.name}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute top-3 left-[5%] bg-opacity-50 text-white px-2 py-1 rounded-lg">
                            <h2 className="text-2xl font-semibold truncate">{room.name}</h2>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="grid gap-6 mx-auto md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
              {filteredRooms.map((room, index) => (
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
                      <div className="opacity-90 h-full">
                        <Image
                          src={roomImage}
                          alt={`Image de ${room.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-3 left-[5%] bg-opacity-50 text-white px-2 py-1 rounded-lg">
                        <h2 className="text-2xl font-semibold truncate">{room.name}</h2>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
