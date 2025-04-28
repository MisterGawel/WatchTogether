'use client';

import { collection, getDocs } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Card } from '@heroui/react';
import { Button } from '@heroui/button';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const getUsersInCommunity = async (communityId) => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  const usersInCommunity = [];

  snapshot.forEach((docSnap) => {
    const userData = docSnap.data();
    if (userData.communities && userData.communities[communityId]) {
      usersInCommunity.push({ id: docSnap.id, ...userData });
    }
  });

  return usersInCommunity;
};

export default function CommunityMembers({ communityId, Role }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    const users = await getUsersInCommunity(communityId);
    setMembers(users);
    setLoading(false);
  };

  useEffect(() => {
    if (communityId) {
      fetchMembers();
    }
  }, [communityId]);

  const promoteToAdmin = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) return;

    const userData = userSnapshot.data();
    const updatedCommunities = { ...userData.communities, [communityId]: 'admin' };

    await updateDoc(userRef, {
      communities: updatedCommunities
    });

    // Refresh members list after promotion
    fetchMembers();
  };

  if (loading) {
    return <div className="text-center mt-10">Chargement des membres...</div>;
  }

  if (members.length === 0) {
    return <div className="text-center mt-10">Aucun membre trouvé.</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <Card key={member.id} className="p-6 shadow-lg rounded-2xl">
          <h2 className="text-xl font-bold">{member.name || 'Utilisateur inconnu'}</h2>
          <p className="mt-2 text-gray-600">
            Rôle : {member.communities?.[communityId] || 'membre'}
          </p>

          {/* Si moi je suis Admin (Role === 'admin') et que le membre n'est pas admin */}
          {Role === 'admin' && member.communities?.[communityId] !== 'admin' && (
            <Button
              className="mt-4"
              onClick={() => promoteToAdmin(member.id)}
            >
              Promouvoir en Admin
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
