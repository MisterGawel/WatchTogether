"use client";

import { useState } from "react";
import { db } from "../../../firebase"; // 🔥 Import Firestore
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { createRoom } from "./roomService";


export default function Page() {
    const [roomName, setRoomName] = useState("");
    //const [communityID, setcommunityID] = useState("");
    //const [idAdmin, setidAdmin] = useState("");
    const router = useRouter(); // Initialiser le router

    const communityID = "UIyd1HlGNJACSPUNP2pl";
    const idAdmin = "2";
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Empêche le rechargement de la page

        try {
            const roomId = await createRoom(roomName, communityID, idAdmin);
            router.push(`/rooms/new/${roomId}`);
        } catch (error) {
            alert("error"); // Affiche le message d'erreur spécifique
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96"
            >
                <label htmlFor="input" className="block text-lg font-bold text-gray-700 dark:text-gray-300">
                    Create Room (Community) :
                </label>
                <input
                    id="input"
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full mt-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md 
                    focus:ring-2 focus:ring-blue-500 focus:outline-none text-black dark:text-white"
                    placeholder="Enter room name"
                />
                
                <button
                    type="submit"
                    className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition"
                >
                    Create
                </button>
            </form>
        </div>
    );
}
