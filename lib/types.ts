export interface Room {
	admin: string;
	community: string;
	createdAt: string;
	name: string;
	id: string;
}

export interface Message {
	text: string;
	timestamp: number;
	user: string;
	id?: string;
}

export interface User {
	communities: Record<string, Role>;
	email: string;
	name: string;
	room?: Room[];
	id: string;
}

enum Role {
	admin = 'admin',
	member = 'member',
}
