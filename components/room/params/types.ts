// components/room/params/types.ts
export interface RoomParams {
    id: string;
    name?: string;
    community?: string;
    admin?: string;
  }
  
  export interface RoomData {
    name: string;
    community: string;
    admin: string;
  }
  
  export interface BanData {
  userId: string;
  userName: string;
  bannedBy: string;       // UID de l'admin qui bannit
  bannedByUsername: string; // Nom de l'admin qui bannit
  bannedAt: string;
  roomId: string;
}
  
  export interface UserRenameParams {
  roomId: string;
  oldName: string;
  newName: string;
  isGuest: boolean;
  currentUser?: any; 
}

  export interface ShareOptions {
    roomName: string;
    roomUrl: string;
  }