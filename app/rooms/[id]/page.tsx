'use client';
import { BsArrowRight } from 'react-icons/bs';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState} from 'react';
import SyncedVideoPlayer from '@/components/room/SyncedVideoPlayer';
import VideoQueue from '@/components/room/VideoQueue';
import VideoHistory from '@/components/room/VideoHistory';
import ChatRoomSocket from '@/components/room/ChatRoomSocket';
import SearchBar from '@/components/room/SearchBar';
import { auth, db } from '@/app/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, writeBatch, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { Button } from '@heroui/button';
import { useRouter } from 'next/navigation';
import { BsFillCameraVideoFill } from 'react-icons/bs';
import { MdDelete } from 'react-icons/md';
import { BsFillMegaphoneFill } from 'react-icons/bs';
import Link from 'next/link';
import { Tabs, Tab } from '@heroui/tabs';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { Input } from '@heroui/input';
import { deleteAllLinks } from '@/components/room/params/linkManagement';
import { deleteAllMessages } from '@/components/room/params/messageManagement';
import { fetchRoomData, deleteRoom, copyRoomLink, shareOnWhatsApp, shareOnTelegram, getShareMessage, renameRoom } from '@/components/room/params/roomManagement';
import { updateUserMessages, checkIfUserIsBanned, renameUser } from '@/components/room/params/userManagement';
import { UserRenameParams as ImportedUserRenameParams } from '@/components/room/params/types';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { FiSettings } from 'react-icons/fi';


interface BanData {
  userId: string;
  bannedAt: string;
  bannedBy: string;
  roomId: string;
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomId } = use(params);
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const router = useRouter();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState(true);
  const [roomName, setRoomName] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('');
  const [loadingNames, setLoadingNames] = useState(false);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [userToBan, setUserToBan] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [showRenameForm, setShowRenameForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  // Vérifier le préférence de l'utilisateur au chargement
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // Appliquer le mode sombre/clair au document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Mettre à jour le message de partage
  useEffect(() => {
    if (roomName) {
      const shareOptions = {
        roomName: roomName,
        roomUrl: window.location.href
      };
      setShareMessage(getShareMessage(shareOptions));
    }
  }, [roomName]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleShare = (platform: 'whatsapp' | 'telegram') => {
    if (!roomName) return;

    const shareOptions = {
      roomName: roomName,
      roomUrl: window.location.href
    };

    switch (platform) {
      case 'whatsapp':
        shareOnWhatsApp(shareOptions);
        break;
      case 'telegram':
        shareOnTelegram(shareOptions);
        break;
    }
    setShowShareMenu(false);
  };

  // Récupérer le nom de l'admin
  const fetchAdminName = async (adminId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', adminId));
      if (userDoc.exists()) {
        return userDoc.data().name || 'Admin';
      }
      return 'Admin';
    } catch (error) {
      console.error('Erreur lors de la récupération du nom admin:', error);
      return 'Admin';
    }
  };

  // On vérifie que la salle existe sinon on redirige vers la page d'accueil et on affiche une alerte
  useEffect(() => {
    if (!roomId) return;
    const checkRoomExists = async () => {
      try {
        const roomData = await fetchRoomData(roomId);
        if (!roomData) {
          router.push('/?error=room-not-found');
        } else {
          setRoomName(roomData.name || '');
          setCommunityId(roomData.community || null);
          
          // Récupérer le nom de l'admin
          if (roomData.admin) {
            const adminName = await fetchAdminName(roomData.admin);
            setAdminName(adminName);
          }
        }
      } catch (err) {
        console.error('Erreur vérification salle:', err);
        router.push('/');
      }
    };
    checkRoomExists();
  }, [roomId, router]);

  // Vérification de l'état de connexion de l'utilisateur
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Utilisateur connecté
    const isBanned = await checkIfUserIsBanned(roomId, user.uid);
    if (isBanned) {
      alert(`Vous avez été banni de cette room (ID: ${user.uid})`);
      router.push('/');
      return;
    }

    setCurrentUser(user);
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setUserName(data.name || user.email || 'Utilisateur');
    }
    setIsGuest(false);
  } else {
    // Utilisateur non connecté (invité)
    let guestName = localStorage.getItem('guestName');
    if (!guestName) {
      guestName = `Invité_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem('guestName', guestName);
    }

    // Vérifier si le nom d'invité est banni
    const isGuestBanned = await checkIfUserIsBanned(roomId, `guest_${guestName}`);
    if (isGuestBanned) {
      alert(`Le nom "${guestName}" est banni de cette room`);
      localStorage.removeItem('guestName'); // Permet de choisir un nouveau nom
      router.push('/');
      return;
    }

    setCurrentUser({
      uid: `guest_${guestName}`,
      name: guestName,
    });
    setUserName(guestName);
    setIsGuest(true);
  }
});
    return () => unsub();
  }, [roomId, router, communityId]);

  // Vérification si l'utilisateur est admin de la salle//
  useEffect(() => {
    if (!currentUser || !roomId) return;

    const checkAdmin = async () => {
      try {
        const roomData = await fetchRoomData(roomId);
        if (roomData) {
          setIsAdmin(roomData.admin === currentUser.uid);
        }
      } catch (err) {
        console.error('Erreur vérification admin:', err);
      }
    };

    checkAdmin();
  }, [currentUser, roomId]);

  // Code pour le nombre de personnes dans la room
  useEffect(() => {
    if (!currentUser || !roomId) return;

    const interval = setInterval(() => {
      setDoc(doc(db, 'presence', currentUser.uid), {
        userId: currentUser.uid,
        roomId: roomId,
        lastSeen: Date.now(),
      });
    }, 10000); // ping toutes les 10s

    return () => clearInterval(interval);
  }, [currentUser, roomId]);

  const handleCopyLink = async () => {
    try {
      await copyRoomLink(roomId);
      alert('Lien copié dans le presse-papier');
    } catch (error) {
      console.error('Erreur lors de la copie du lien:', error);
      alert('Erreur lors de la copie du lien');
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomId) return;

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette room ?')) {
      return;
    }

    try {
      await deleteRoom(roomId);
      alert('Room supprimée avec succès');
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Une erreur est survenue lors de la suppression');
    }
  };

  const handleDeleteAllMessages = async () => {
    if (!roomId) return;

    try {
      await deleteAllMessages(roomId);
      alert('Tous les messages ont été supprimés !');
    } catch (error) {
      console.error('Erreur suppression messages:', error);
      alert('Erreur lors de la suppression des messages');
    }
  };

  const handleDeleteAllLinks = async () => {
    if (!roomId) return;

    try {
      await deleteAllLinks(roomId);
      alert('Tous les liens ont été supprimés !');
    } catch (error) {
      console.error('Erreur suppression liens:', error);
      alert('Erreur lors de la suppression des liens');
    }
  };

  const handleRenameUser = async (oldName: string, newName: string) => {
    if (!newName.trim()) {
      alert('Le pseudo ne peut pas être vide');
      return false;
    }

    if (newName.trim() === oldName) {
      return true;
    }

    try {
      const params: ImportedUserRenameParams = {
        roomId,
        oldName,
        newName: newName.trim(),
        isGuest,
        currentUser
      };

      const renameSuccess = await renameUser(params);
      
      if (!renameSuccess) {
        alert("Ce pseudo est déjà utilisé dans cette room");
        setUserName(oldName);
        return false;
      }
      
      setUserName(newName.trim());
      if (isGuest) {
        localStorage.setItem('guestName', newName.trim());
      }
      
      setCurrentUser({
        ...currentUser,
        name: newName.trim()
      });
      
      return true;
    } catch (error: any) {
      console.error("Erreur lors du changement de pseudo:", error);
      alert(error.message || "Une erreur technique est survenue");
      return false;
    }
  };

  const handleBanClick = (userId: string) => {
    setUserToBan(userId);
    setShowBanModal(true);
  };

  const handleRenameRoom = async () => {
    if (!newRoomName.trim()) {
      alert('Le nom de la room ne peut pas être vide');
      return;
    }

    try {
      await renameRoom(roomId, newRoomName.trim());
      setRoomName(newRoomName.trim());
      setShowRenameForm(false);
      alert('Nom de la room modifié avec succès');
    } catch (error) {
      console.error('Erreur lors du renommage de la room:', error);
      alert('Une erreur est survenue lors du renommage');
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <header className={`px-6 py-4 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex flex-col items-center justify-between mx-auto space-y-4 max-w-7xl md:flex-row md:space-y-0">
          <h1 className="text-2xl font-bold">
            {roomName || 'Unknown Room'}
          </h1>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full focus:outline-none"
              aria-label={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {darkMode ? (
                <SunIcon className="w-6 h-6 text-yellow-300" />
              ) : (
                <MoonIcon className="w-6 h-6 text-gray-700" />
              )}
            </button>

            <span className={`mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {userName}
            </span>

            
            {/* Bouton Paramètres */}
            <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <FiSettings size={24} />
            </button>


            {/* Bouton Quitter la salle dans Card */}
            <Card className={`w-auto shadow-none ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <CardHeader className="relative flex items-center justify-end px-0 pt-0 pb-2">
                <Button
                    color="danger"
                    size="md"
                    as={Link}
                    endContent={<BsArrowRight />}
                    href={`/`}
                >
                    Quitter la salle
                </Button>
                </CardHeader>
            </Card>

          </div>
          
        </div>
      </header>

      <div className="flex flex-col w-full min-h-screen gap-4 p-4 lg:flex-row">
        <div className="flex flex-col w-full gap-4 lg:w-3/5">
          <div className={`flex flex-col w-full h-full gap-4 px-4 py-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <SearchBar
						// @ts-expect-error blabla
						onSelect={async (video) => {
							await fetch(`/api/rooms/${roomId}/add-video`, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									url: video.url,
									user: currentUser.name || 'anonymous',
									title: video.title,
									thumbnail: video.thumbnail,
								}),
							});
						}}
					/>

            <SyncedVideoPlayer
              roomId={roomId}
              userId={currentUser.uid}
              isAdmin={isAdmin}
            />
            <Divider className={`mt-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <Tabs
              isVertical
              classNames={{
                base: `flex flex-col gap-4 ${darkMode ? 'group-data-[selected=true]:bg-gray-700 data-[selected=true]:text-gray-100' : 'group-data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900'}`,
                tab: `flex flex-col items-center justify-center w-full h-full px-8 py-2 text-sm font-medium text-left transition-colors rounded-lg cursor-pointer ${darkMode ? 'hover:bg-gray-700 group-data-[selected=true]:bg-gray-700' : 'hover:bg-gray-100 group-data-[selected=true]:bg-gray-100'}`,
                cursor: darkMode ? 'bg-gray-600 text-gray-100 font-bold' : 'bg-gray-200 text-gray-900 font-bold',
              }}
            >
              <Tab key={'Historique'} title="Historique">
                <VideoHistory roomId={roomId} />
              </Tab>
              <Tab key={'File d\'attente'} title="File d'attente">
                <VideoQueue
                  roomId={roomId}
                  currentUserId={currentUser.uid}
                  isAdmin={isAdmin}
                />
              </Tab>
            </Tabs>
          </div>
        </div>

        <div className="flex flex-col w-full lg:w-2/5">
          <div className={`flex flex-col w-full h-full gap-4 px-4 py-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            
            <ChatRoomSocket
              roomId={roomId}
              username={userName}
              Role={isAdmin ? 'admin' : 'user'}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={`p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Paramètres de la Room
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowRenameForm(false);
                }}
                className={`text-2xl ${darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
              >
                &times;
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold">
                  Informations
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Nom:
                    </p>
                    {showRenameForm ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          placeholder="Nouveau nom"
                          className={`w-full ${darkMode ? 'bg-gray-600 text-white placeholder-gray-400' : 'bg-white text-gray-900'}`}
                        />
                        <Button 
                          onPress={handleRenameRoom}
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          Valider
                        </Button>
                      </div>
                    ) : (
                      <p>
                        {roomName || 'Unknown'}
                        {isAdmin && (
                          <button 
                            onClick={() => {
                              setNewRoomName(roomName);
                              setShowRenameForm(true);
                            }}
                            className="ml-2 text-blue-500 hover:text-blue-700"
                          >
                            Modifier
                          </button>
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Communauté:
                    </p>
                    <p>
                      {communityId || 'Aucune'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Admin:
                    </p>
                    <p>
                      {adminName || 'Aucun'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center w-full gap-2 px-4 py-2 text-white transition bg-blue-500 rounded-md hover:bg-blue-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copier le lien
              </button>

              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center justify-center w-full gap-2 px-4 py-2 text-white transition bg-green-500 rounded-md hover:bg-green-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
                Partager
              </button>

              {showShareMenu && (
                <div className="flex justify-center gap-4 mt-4">
                    <FaWhatsapp
                    onClick={() => handleShare('whatsapp')}
                    className="text-green-500 hover:text-green-600 cursor-pointer w-10 h-10"
                    />
                    <FaTelegram
                    onClick={() => handleShare('telegram')}
                    className="text-blue-500 hover:text-blue-600 cursor-pointer w-10 h-10"
                    />
                </div>
                )}


              {/* Afficher seulement pour les invités OU les rooms sans communauté */}
              {(!communityId && isGuest) && (
                <div className={`flex flex-col p-3 space-y-2 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Votre pseudo :
                  </span>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Choisissez un pseudo unique"
                      className={`w-full ${darkMode ? 'bg-white-600 text-white placeholder-gray-400' : 'bg-white text-gray-900'}`}
                    />
                    <Button 
                      onPress={() => handleRenameUser(currentUser.name, userName)}
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      Modifier
                    </Button>
                  </div>
                  
                </div>
              )}

              {isAdmin && (
                <div className="space-y-3">
                  <h3 className="font-semibold">
                    Actions Admin
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        router.push(`/rooms/edit/${roomId}`);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-white transition bg-green-500 rounded-md hover:bg-green-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Modifier
                    </button>
                    <button
                      onClick={handleDeleteRoom}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-white transition bg-red-500 rounded-md hover:bg-red-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Supprimer
                    </button>

                    <button
                      onClick={handleDeleteAllMessages}
                      className="w-full px-4 py-2 mt-4 text-white bg-red-400 rounded-md hover:bg-red-500"
                    >
                      Supprimer tous les messages
                    </button>

                    <button
                      onClick={handleDeleteAllLinks}
                      className="w-full px-4 py-2 mt-4 text-white bg-red-400 rounded-md hover:bg-red-500"
                    >
                      Supprimer tous liens
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}