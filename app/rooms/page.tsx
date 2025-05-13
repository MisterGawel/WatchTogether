'use client';

import React, { useEffect, useState } from 'react';
import { Card, Image } from '@heroui/react';
import { motion } from 'framer-motion';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface RoomInfo {
  id: string;
  name: string;
  communityId?: string | null;
  communityName?: string;
}

export default function UserRoomsPage() {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'withCommunity' | 'withoutCommunity'>('all');
  const [showMode, setShowMode] = useState<'myRooms' | 'communityRooms'>('myRooms');
  const [communityNames, setCommunityNames] = useState<Record<string, string>>({});

  const router = useRouter();
  const roomImage = 'https://heroui.com/images/hero-card-complete.jpeg';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      if (currentUser) {
        setUser(currentUser);
        if (showMode === 'myRooms') {
          await fetchUserRooms(currentUser.uid);
        } else {
          await fetchCommunityRooms(currentUser.uid);
        }
      } else {
        setUser(null);
        setRooms([]);
      }
    });
    return () => unsubscribe();
  }, [showMode]);

  const fetchCommunityNames = async (communityIds: string[]) => {
    const names: Record<string, string> = {};
    const batchSize = 10;
    
    for (let i = 0; i < communityIds.length; i += batchSize) {
      const batch = communityIds.slice(i, i + batchSize);
      const communitiesQuery = query(
        collection(db, 'communities'),
        where('__name__', 'in', batch)
      );
      const communitiesSnapshot = await getDocs(communitiesQuery);
      
      communitiesSnapshot.forEach(doc => {
        names[doc.id] = doc.data().name || doc.id;
      });
    }
    
    setCommunityNames(names);
    return names;
  };

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

        setRooms(roomsWithNames.filter(room => room.name !== 'Room inconnue'));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityRooms = async (userId: string) => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userCommunities = userData.communities || [];

        if (userCommunities.length === 0) {
          setRooms([]);
          return;
        }

        const communityNames = await fetchCommunityNames(userCommunities);

        const batchSize = 10;
        let communityRooms: RoomInfo[] = [];

        for (let i = 0; i < userCommunities.length; i += batchSize) {
          const batch = userCommunities.slice(i, i + batchSize);
          const roomsQuery = query(
            collection(db, 'rooms'),
            where('communityId', 'in', batch)
          );
          const roomsSnapshot = await getDocs(roomsQuery);
          
          const batchRooms = roomsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || 'Sans nom',
            communityId: doc.data().communityId || null,
            communityName: doc.data().communityId ? communityNames[doc.data().communityId] : undefined,
          }));

          communityRooms = [...communityRooms, ...batchRooms];
        }

        setRooms(communityRooms);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des rooms des communautés:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (roomId: string) => {
    router.push(`/rooms/${roomId}`);
  };

  const filteredRooms = rooms.filter((room) => {
    const searchTerm = search.toLowerCase();
    const roomName = room.name.toLowerCase();
    const communityName = room.communityId 
      ? (communityNames[room.communityId]?.toLowerCase() || '')
      : '';

    // Vérifie si le nom de la room OU de la communauté commence par le terme de recherche
    const roomMatch = roomName.startsWith(searchTerm);
    const communityMatch = communityName.startsWith(searchTerm);

    const matchSearch = roomMatch || communityMatch;
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
        <h1 className="text-4xl font-bold text-gray-800 text-center">
          {showMode === 'myRooms' ? 'Mes Rooms' : 'Rooms des Communautés'}
        </h1>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Mes Rooms</span>
          <button
            onClick={() => setShowMode(showMode === 'myRooms' ? 'communityRooms' : 'myRooms')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              showMode === 'communityRooms' ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showMode === 'communityRooms' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700">Communautés</span>
        </div>

        <input
          type="text"
          placeholder="Rechercher"
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
            <p className="text-gray-600">Chargement des rooms...</p>
          </div>
        </div>
      ) : (
        <>
          {filteredRooms.length === 0 ? (
            <div className="text-center text-gray-600 py-10">
              {showMode === 'communityRooms' 
                ? "Vous n'avez pas de rooms dans vos communautés ou vous n'êtes membre d'aucune communauté."
                : `Aucune room ne commence par "${search}"`}
            </div>
          ) : filterType === 'withCommunity' ? (
            Object.entries(roomsByCommunity).map(([communityId, communityRooms]) => (
              <div key={communityId} className="mb-10 max-w-7xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4 text-indigo-600">
                  Communauté: {communityNames[communityId] || communityId}
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
                            {room.communityId && (
                              <p className="text-sm opacity-80">
                                {communityNames[room.communityId] || room.communityId}
                              </p>
                            )}
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
                        {room.communityId && (
                          <p className="text-sm opacity-80">
                            {communityNames[room.communityId] || room.communityId}
                          </p>
                        )}
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