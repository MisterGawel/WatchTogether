'use client'

import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { User } from "firebase/auth";

export default function Profile() {
    const [user, setUser] = useState<User | null>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rooms, setRooms] = useState<string[]>([]);

    // Récupérer les données de l'utilisateur
    useEffect(() => {
        if (auth.currentUser) {
            const userData = auth.currentUser;
            setUser(userData);
            setEmail(userData.email || '');
            // Simuler la récupération des rooms créées par l'utilisateur
            setRooms(["Room 1", "Room 2", "Room 3"]); // À remplacer par l'appel à votre API de rooms
        }
    }, []);

    // Fonction pour changer l'email
    const handleChangeEmail = async () => {
        if (user) {
            try {
                /*                 await user.updateEmail(email); */
                alert("Email mis à jour !");
            } catch (error) {
                console.error("Erreur lors de la mise à jour de l'email:", error);
                alert("Erreur lors de la mise à jour de l'email.");
            }
        }
    };

    // Fonction pour changer le mot de passe
    const handleChangePassword = async () => {
        if (user) {
            try {
/*                 await user.updatePassword(password);
 */                alert("Mot de passe mis à jour !");
            } catch (error) {
                console.error("Erreur lors de la mise à jour du mot de passe:", error);
                alert("Erreur lors de la mise à jour du mot de passe.");
            }
        }
    };

    // Fonction pour supprimer le compte
    const handleDeleteAccount = async () => {
        if (user) {
            try {
                await user.delete();
                alert("Compte supprimé avec succès !");
                signOut(auth); // Déconnecter l'utilisateur après suppression
            } catch (error) {
                console.error("Erreur lors de la suppression du compte:", error);
                alert("Erreur lors de la suppression du compte.");
            }
        }
    };

    return (
        <div className="mx-auto p-6 h-screen bg-blue-100 w-screen text-black">
            <div className="flex flex-col max-w-[30rem] mx-auto">
                <h1 className="text-3xl font-semibold text-center mb-6">Mon Profil</h1>
                <div className="space-y-4">
                    {/* Informations personnelles */}
                    {user && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h2 className="text-xl font-semibold">Informations personnelles</h2>
                            <p><strong>Nom : </strong>{user.displayName}</p>
                            <p><strong>Email : </strong>{email}</p>
                            <p><strong>Mot de passe : </strong>*******</p>
                        </div>
                    )}
                    {/* Rooms créées */}
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="text-xl font-semibold">Mes Rooms</h2>
                        {rooms.length > 0 ? (
                            <ul>
                                {rooms.map((room, index) => (
                                    <li key={index} className="py-2">{room}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>Aucune room créée</p>
                        )}
                    </div>
                    {/* Modifier l'email */}
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="text-xl font-semibold">Changer d'email</h2>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border p-2 rounded-lg w-full mb-4"
                            placeholder="Entrez un nouvel email"
                        />
                        <button
                            onClick={handleChangeEmail}
                            className="bg-blue-500 text-white p-2 rounded-lg w-full">
                            Changer l'email
                        </button>
                    </div>
                    {/* Modifier le mot de passe */}
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="text-xl font-semibold">Changer de mot de passe</h2>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="border p-2 rounded-lg w-full mb-4"
                            placeholder="Entrez un nouveau mot de passe"
                        />
                        <button
                            onClick={handleChangePassword}
                            className="bg-blue-500 text-white p-2 rounded-lg w-full">
                            Changer le mot de passe
                        </button>
                    </div>
                    {/* Bouton de suppression du compte */}
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="text-xl font-semibold">Supprimer mon compte</h2>
                        <button
                            onClick={handleDeleteAccount}
                            className="bg-red-500 text-white p-2 rounded-lg w-full flex items-center justify-center gap-2">
                            Supprimer le compte
                        </button>
                    </div>
                    {/* Déconnexion */}
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <button
                            onClick={() => signOut(auth)}
                            className="bg-gray-500 text-white p-2 rounded-lg w-full flex items-center justify-center gap-2">
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}